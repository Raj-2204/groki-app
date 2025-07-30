import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VoiceCommand, Recipe, InventoryItem } from '../types';

// You'll need to set this in your environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    console.log('GeminiService constructor - API_KEY available:', !!API_KEY);
    if (API_KEY) {
      console.log('Initializing GoogleGenerativeAI');
      this.genAI = new GoogleGenerativeAI(API_KEY);
    } else {
      console.warn('VITE_GEMINI_API_KEY not found in environment variables');
    }
  }

  async parseVoiceCommand(transcript: string): Promise<VoiceCommand> {
    console.log('parseVoiceCommand called with:', transcript);
    console.log('Gemini AI available:', !!this.genAI);
    
    if (!this.genAI) {
      console.log('No Gemini AI available, using fallback parser');
      return this.fallbackParser(transcript);
    }

    try {
      console.log('Using Gemini AI to parse command');
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `Parse this voice command for a grocery inventory app: "${transcript}"

IMPORTANT: Handle common speech recognition errors:
- "at" often means "add" (e.g., "at three apples" = "add three apples")
- "hat" often means "add" (e.g., "hat two bananas" = "add two bananas")  
- "ad" often means "add" (e.g., "ad five tomatoes" = "add five tomatoes")

Extract ONLY the essential information. Focus on:
1. The action (add/remove/list/recipes)
2. The food item name (clean food name only - ignore filler words and units)
3. The quantity if specified
4. The unit if specified (separate from item name)

CRITICAL: Separate units from item names. Common units include:
- Weight: kg, g, grams, kilograms, lbs, pounds, oz, ounces
- Volume: ml, milliliters, liters, litres, l, cups, tbsp, tablespoons, tsp, teaspoons
- Count: pieces, items, cans, bottles, bags, boxes

UNIT PARSING EXAMPLES - PAY SPECIAL ATTENTION TO THESE:
- "add 2 ml of oil" → item: "oil", quantity: 2, unit: "ml"
- "add 2 liters of oil" → item: "oil", quantity: 2, unit: "liters"  
- "add 2 litres of oil" → item: "oil", quantity: 2, unit: "liters"
- "add 3 l of milk" → item: "milk", quantity: 3, unit: "l"
- "add 500g flour" → item: "flour", quantity: 500, unit: "g"
- "add 2 kg potatoes" → item: "potatoes", quantity: 2, unit: "kg"
- "add 3 cups sugar" → item: "sugar", quantity: 3, unit: "cups"
- "add 2 tbsp vanilla" → item: "vanilla", quantity: 2, unit: "tbsp"
- "add 5 pieces chicken" → item: "chicken", quantity: 5, unit: "pieces"

Respond with JSON in this exact format:
{
  "action": "add|remove|update|list|recipes|help",
  "item": "clean food item name only (no units)",
  "quantity": number (if specified, otherwise null),
  "unit": "unit type (if specified, otherwise 'pieces')",
  "raw": "${transcript}"
}

Examples:
- "add 3 apples" → {"action": "add", "item": "apples", "quantity": 3, "unit": "pieces"}
- "at three apples" → {"action": "add", "item": "apples", "quantity": 3, "unit": "pieces"}
- "hat two bananas" → {"action": "add", "item": "bananas", "quantity": 2, "unit": "pieces"}
- "ad five tomatoes" → {"action": "add", "item": "tomatoes", "quantity": 5, "unit": "pieces"}
- "add butter chicken to the cart" → {"action": "add", "item": "butter chicken", "quantity": 1, "unit": "pieces"}
- "two butter chicken kart" → {"action": "add", "item": "butter chicken", "quantity": 2, "unit": "pieces"}
- "put five tomatoes in my list" → {"action": "add", "item": "tomatoes", "quantity": 5, "unit": "pieces"}
- "add three eggs" → {"action": "add", "item": "eggs", "quantity": 3, "unit": "pieces"}
- "remove 1 apple from inventory" → {"action": "remove", "item": "apple", "quantity": 1}
- "remove one tomato from the cart" → {"action": "remove", "item": "tomato", "quantity": 1}
- "remove an apple" → {"action": "remove", "item": "apple", "quantity": 1}
- "remove a banana" → {"action": "remove", "item": "banana", "quantity": 1}
- "remove milk" → {"action": "remove", "item": "milk", "quantity": null}
- "delete 2 bananas" → {"action": "remove", "item": "bananas", "quantity": 2}
- "remove three eggs from my list" → {"action": "remove", "item": "eggs", "quantity": 3}
- "show recipes" → {"action": "recipes"}
- "what's in my inventory" → {"action": "list"}

CRITICAL PARSING RULES:
1. QUANTITY DETECTION: Look for numbers (1,2,3) or words (a,an,one,two,three,four,five,six,seven,eight,nine,ten) that indicate quantity
2. ITEM EXTRACTION: The food item comes AFTER the quantity word
3. WORD NUMBERS: Convert word numbers to digits: a=1, an=1, one=1, two=2, three=3, four=4, five=5, etc.
4. FILLER WORDS: Ignore "to", "the", "cart", "kart", "inventory", "list", "my", "in", "from", "into", "add", "put"
5. STRUCTURE: "add [QUANTITY] [FOOD_ITEM] [FILLER_WORDS]" or "[QUANTITY] [FOOD_ITEM] [FILLER_WORDS]"

EXAMPLES OF QUANTITY PARSING:
- "add a banana" → quantity=1, item="banana"
- "add an apple" → quantity=1, item="apple"
- "add two bananas" → quantity=2, item="bananas" 
- "add three apples" → quantity=3, item="apples"
- "put five tomatoes" → quantity=5, item="tomatoes"
- "six eggs in cart" → quantity=6, item="eggs"`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('Gemini raw response:', text);
      
      try {
        const parsed = JSON.parse(text);
        console.log('Gemini parsed result:', parsed);
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON response:', parseError);
        console.log('Raw response was:', text);
        return this.fallbackParser(transcript);
      }
    } catch (error) {
      console.error('Gemini parsing error:', error);
      console.log('Falling back to local parser');
      return this.fallbackParser(transcript);
    }
  }

  private fallbackParser(transcript: string): VoiceCommand {
    let lower = transcript.toLowerCase().trim();
    
    // Fix common speech recognition errors
    const original = lower;
    lower = lower
      .replace(/^at\b/g, 'add')     // "at three apples" -> "add three apples"
      .replace(/^hat\b/g, 'add')    // "hat three apples" -> "add three apples"  
      .replace(/^ad\b/g, 'add')     // "ad three apples" -> "add three apples"
      .replace(/^edd\b/g, 'add')    // "edd three apples" -> "add three apples"
      .replace(/^head\b/g, 'add')   // "head three apples" -> "add three apples"
      .replace(/^egg\s+at\b/g, 'add'); // "egg at three apples" -> "add three apples"
    
    if (original !== lower) {
      console.log('Speech recognition error corrected:', original, '→', lower);
    }
    
    // List of common units
    const units = ['kg', 'g', 'grams', 'kilograms', 'lbs', 'pounds', 'oz', 'ounces', 
                   'ml', 'milliliters', 'liters', 'l', 'cups', 'tbsp', 'tablespoons', 
                   'tsp', 'teaspoons', 'pieces', 'items', 'cans', 'bottles', 'bags', 'boxes'];
    
    // Helper function to clean item names and remove units
    const cleanItemName = (itemText: string): string => {
      return itemText
        .replace(/\b(to|from|the|cart|kart|card|inventory|list|my|in|into|put|add|remove|delete|out|of)\b/g, '')
        .trim()
        .replace(/\s+/g, ' ');
    };

    // Helper function to extract unit and clean item name
    const extractUnitAndItem = (text: string): { item: string; unit: string } => {
      // Remove "of" from the text first as it's a connector word
      const cleanText = text.replace(/\bof\b/gi, ' ').trim();
      const words = cleanText.split(/\s+/).filter(word => word.length > 0);
      let foundUnit = 'pieces';
      const itemWords: string[] = [];
      
      console.log('extractUnitAndItem - input:', text, 'cleanText:', cleanText, 'words:', words);
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i].toLowerCase();
        if (units.includes(word)) {
          foundUnit = word;
          console.log('Found unit:', word);
        } else {
          itemWords.push(words[i]);
        }
      }
      
      const finalItem = cleanItemName(itemWords.join(' '));
      console.log('extractUnitAndItem result - item:', finalItem, 'unit:', foundUnit);
      
      return {
        item: finalItem,
        unit: foundUnit
      };
    };

    // Helper function to convert word numbers to digits
    const convertWordNumbers = (text: string): string => {
      const wordToNumber: Record<string, string> = {
        'a': '1', 'an': '1',
        'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
        'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
        'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
        'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20'
      };
      
      let result = text;
      Object.entries(wordToNumber).forEach(([word, number]) => {
        result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), number);
      });
      
      console.log('convertWordNumbers:', text, '→', result);
      return result;
    };
    
    // Add command (including implicit add commands and speech recognition errors)
    if (lower.includes('add') || lower.includes('put') || /^\s*(a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+\w+/.test(lower)) {
      // Convert word numbers to digits first
      const converted = convertWordNumbers(lower);
      console.log('Fallback parser - trying to parse:', transcript);
      console.log('Converted:', converted);
      
      // Try explicit add/put commands with quantity and potentially units
      // Pattern: "add 2 ml of oil" or "add 500g flour" or "add 3 cups sugar"
      let match = converted.match(/(?:add|put)\s+(\d+)\s+(.+?)(?:\s+(?:to|into|in)\s+(?:the\s+)?(?:cart|kart|inventory|list))?$/);
      console.log('Match 1 (add/put with quantity):', match);
      
      if (match) {
        const { item, unit } = extractUnitAndItem(match[2]);
        console.log('Parsed with unit extraction - item:', item, 'quantity:', match[1], 'unit:', unit);
        return {
          action: 'add',
          item: item,
          quantity: parseInt(match[1]),
          unit: unit,
          raw: transcript,
        };
      }
      
      // Try implicit commands starting with quantity (like "2 ml oil" or "5 potatoes")
      match = converted.match(/^\s*(\d+)\s+(.+?)(?:\s+(?:to|into|in)\s+(?:the\s+)?(?:cart|kart|inventory|list))?$/);
      console.log('Match 2 (implicit with quantity):', match);
      
      if (match) {
        const { item, unit } = extractUnitAndItem(match[2]);
        console.log('Parsed implicit with unit extraction - item:', item, 'quantity:', match[1], 'unit:', unit);
        return {
          action: 'add',
          item: item,
          quantity: parseInt(match[1]),
          unit: unit,
          raw: transcript,
        };
      }
      
      // Finally, try explicit add/put commands without quantity
      match = converted.match(/(?:add|put)\s+([a-zA-Z\s]+?)(?:\s+(?:to|into|in)\s+(?:the\s+)?(?:cart|kart|inventory|list))?$/);
      
      if (match) {
        const { item, unit } = extractUnitAndItem(match[1]);
        return {
          action: 'add',
          item: item,
          quantity: 1,
          unit: unit,
          raw: transcript,
        };
      }
    }
    
    // Remove command with quantity support
    if (lower.includes('remove') || lower.includes('delete')) {
      // Convert word numbers to digits first
      const converted = convertWordNumbers(lower);
      console.log('Remove command - converted:', converted);
      
      // Try remove with numeric quantity first
      let match = converted.match(/(?:remove|delete)\s+(\d+)\s+([a-zA-Z\s]+?)(?:\s+(?:from|out\s+of)\s+(?:the\s+)?(?:cart|kart|inventory|list|card))?$/);
      console.log('Remove match with quantity:', match);
      
      if (match) {
        const itemName = cleanItemName(match[2]);
        console.log('Remove parsed - item:', itemName, 'quantity:', match[1]);
        return {
          action: 'remove',
          item: itemName,
          quantity: parseInt(match[1]),
          raw: transcript,
        };
      }
      
      // Try remove without quantity
      match = converted.match(/(?:remove|delete)\s+([a-zA-Z\s]+?)(?:\s+(?:from|out\s+of)\s+(?:the\s+)?(?:cart|kart|inventory|list|card))?$/);
      console.log('Remove match without quantity:', match);
      
      if (match) {
        const itemName = cleanItemName(match[1]);
        console.log('Remove parsed - item:', itemName, 'quantity: null');
        return {
          action: 'remove',
          item: itemName,
          raw: transcript,
        };
      }
    }
    
    // Recipe command
    if (lower.includes('recipe') || lower.includes('cook') || lower.includes('meal')) {
      return {
        action: 'recipes',
        raw: transcript,
      };
    }
    
    // List command
    if (lower.includes('list') || lower.includes('inventory') || lower.includes('what') || lower.includes('show')) {
      return {
        action: 'list',
        raw: transcript,
      };
    }
    
    return {
      action: 'help',
      raw: transcript,
    };
  }

  async generateRecipes(inventory: InventoryItem[]): Promise<Recipe[]> {
    console.log('generateRecipes called with inventory:', inventory);
    console.log('Gemini AI available for recipes:', !!this.genAI);
    
    if (!this.genAI) {
      console.log('No Gemini AI available, using fallback recipes');
      return this.fallbackRecipes(inventory);
    }

    try {
      console.log('Using Gemini AI to generate recipes');
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const inventoryList = inventory.map(item => `${item.name}: ${item.quantity} ${item.unit}`).join(', ');
      console.log('Inventory list for recipes:', inventoryList);
      
      const prompt = `Based on this grocery inventory: ${inventoryList}

Generate 3-5 practical recipe suggestions. For each recipe, analyze which ingredients are available and which are missing.

Requirements:
1. Prioritize recipes that use the most available ingredients
2. Include a mix of difficulty levels (easy, medium, hard)
3. Provide detailed, step-by-step instructions
4. Be realistic about cooking times
5. Suggest recipes from different cuisines/meal types

Respond with JSON array:
[{
  "id": "unique-id",
  "name": "Recipe Name",
  "description": "Brief description (1-2 sentences)",
  "ingredients": ["ingredient1 (amount)", "ingredient2 (amount)"],
  "instructions": ["detailed step1", "detailed step2", "detailed step3"],
  "cookingTime": 30,
  "servings": 4,
  "availableIngredients": ["available items from inventory"],
  "missingIngredients": ["missing items needed"],
  "canMake": true/false,
  "cuisine": "Italian/Asian/American/etc",
  "difficulty": "Easy/Medium/Hard"
}]

Focus on making recipes that are practical and achievable with common kitchen equipment.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      console.log('Recipe generation raw response:', text);
      
      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const recipes = JSON.parse(cleanText);
        console.log('Generated recipes:', recipes);
        return recipes;
      } catch (parseError) {
        console.error('Recipe JSON parsing error:', parseError);
        console.log('Raw response was:', text);
        return this.fallbackRecipes(inventory);
      }
    } catch (error) {
      console.error('Recipe generation error:', error);
      console.log('Falling back to default recipes');
      return this.fallbackRecipes(inventory);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generateRecipeFromPrompt(prompt: string): Promise<any> {
    if (!this.genAI) {
      throw new Error('Gemini AI not available');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanText);
      } catch {
        // If JSON parsing fails, return a fallback response
        console.error('JSON parsing failed, returning fallback response');
        return {
          name: "Custom Recipe",
          description: "A recipe generated based on your request",
          cookingTime: 30,
          servings: 4,
          ingredients: ["Various ingredients based on your request"],
          availableIngredients: [],
          missingIngredients: ["Check the full response for details"],
          instructions: [text], // Return the raw text as instructions
          canMake: false,
          tips: []
        };
      }
    } catch (error) {
      console.error('Recipe generation from prompt error:', error);
      throw error;
    }
  }

  async generateConversationalResponse(
    message: string, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inventory: any[], 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conversationHistory: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<{ response: string, actions?: any[] }> {
    if (!this.genAI) {
      return {
        response: "I'm sorry, but I need AI capabilities to have a proper conversation. Please check your API configuration."
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const inventoryList = inventory.map(item => `${item.name}: ${item.quantity} ${item.unit}`).join(', ');
      const recentHistory = conversationHistory.slice(-6).map(msg => 
        `${msg.isUser ? 'User' : 'Groki'}: ${msg.content}`
      ).join('\n');

      const prompt = `You are Groki, a friendly and helpful AI grocery assistant. You help users manage their grocery inventory through natural conversation.

CURRENT INVENTORY: ${inventoryList || 'Empty'}

RECENT CONVERSATION:
${recentHistory}

USER MESSAGE: "${message}"

PERSONALITY GUIDELINES:
- Be warm, friendly, and conversational like a helpful friend
- Use natural language, not robotic responses  
- Show enthusiasm about cooking and food
- Be proactive in offering suggestions
- Use casual language and occasional food emojis
- Remember context from the conversation
- Make jokes or comments about food when appropriate

CAPABILITIES:
1. Add items to inventory (with quantities and units)
2. Remove items from inventory  
3. Show current inventory
4. Suggest recipes based on available ingredients
5. Have general conversations about food, cooking, and groceries
6. Help with meal planning and shopping advice

RESPONSE FORMAT:
Respond with a JSON object containing:
{
  "response": "Your conversational response as Groki",
  "actions": [
    {
      "type": "add_item|remove_item|show_inventory|show_recipes",
      "item": "food item name",
      "quantity": number,
      "unit": "pieces|kg|g|liters|ml|cups|etc"
    }
  ]
}

EXAMPLES:

User: "Add 2 liters of milk"
{
  "response": "Perfect! I've added 2 liters of milk to your inventory 🥛 That should be great for cereal, coffee, or maybe some baking!",
  "actions": [{"type": "add_item", "item": "milk", "quantity": 2, "unit": "liters"}]
}

User: "What can I cook with what I have?"
{
  "response": "Let me check what delicious meals we can whip up with your current ingredients! 👨‍🍳",
  "actions": [{"type": "show_recipes"}]
}

User: "I'm out of eggs"
{
  "response": "Oh no! Running out of eggs is always a bummer 🥚 Should I remove them from your inventory, or do you want me to add some to your shopping list?",
  "actions": [{"type": "remove_item", "item": "eggs"}]
}

User: "How are you doing?"
{
  "response": "I'm doing great, thanks for asking! 😊 I'm excited to help you with your grocery adventures today. Got any cooking plans or need help organizing your pantry?"
}

IMPORTANT PARSING RULES:
- Handle natural language for quantities (two, three, a couple, some, etc.)
- Understand implied actions ("I'm out of X" = remove X, "I bought Y" = add Y)
- Recognize units properly (liters, litres, kg, pounds, cups, etc.)
- Be conversational even when performing actions
- Ask clarifying questions when needed

Now respond to the user's message with personality and appropriate actions!`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanText);
        console.log('Conversational AI response:', parsed);
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse conversational response:', parseError);
        // Return a fallback conversational response
        return {
          response: "I heard you! Let me think about that for a moment... Could you rephrase what you'd like me to help you with? I'm here to help with your grocery inventory! 🛒"
        };
      }
    } catch (error) {
      console.error('Conversational AI error:', error);
      return {
        response: "Sorry, I'm having trouble processing that right now. But I'm still here to help with your groceries! What would you like to do? 😊"
      };
    }
  }

  private fallbackRecipes(inventory: InventoryItem[]): Recipe[] {
    const hasItem = (name: string) => 
      inventory.some(item => item.name.toLowerCase().includes(name.toLowerCase()));

    const recipes: Recipe[] = [];

    if (hasItem('egg') && hasItem('milk')) {
      recipes.push({
        id: '1',
        name: 'Simple Scrambled Eggs',
        description: 'Quick and easy breakfast',
        ingredients: ['2 eggs', '1/4 cup milk', 'salt', 'pepper'],
        instructions: ['Beat eggs with milk', 'Cook in pan', 'Season and serve'],
        cookingTime: 10,
        servings: 1,
        availableIngredients: ['eggs', 'milk'],
        missingIngredients: ['salt', 'pepper'],
        canMake: true,
      });
    }

    if (recipes.length === 0) {
      recipes.push({
        id: '2',
        name: 'Shopping List Recipe',
        description: 'Add more ingredients to unlock recipes!',
        ingredients: ['Various fresh ingredients'],
        instructions: ['Go shopping first!'],
        cookingTime: 0,
        servings: 0,
        availableIngredients: [],
        missingIngredients: ['More ingredients needed'],
        canMake: false,
      });
    }

    return recipes;
  }
}

export const geminiService = new GeminiService();