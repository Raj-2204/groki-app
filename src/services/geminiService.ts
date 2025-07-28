import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VoiceCommand, Recipe, InventoryItem } from '../types';

// You'll need to set this in your environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (API_KEY) {
      this.genAI = new GoogleGenerativeAI(API_KEY);
    }
  }

  async parseVoiceCommand(transcript: string): Promise<VoiceCommand> {
    if (!this.genAI) {
      return this.fallbackParser(transcript);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Parse this voice command for a grocery inventory app: "${transcript}"

IMPORTANT: Handle common speech recognition errors:
- "at" often means "add" (e.g., "at three apples" = "add three apples")
- "hat" often means "add" (e.g., "hat two bananas" = "add two bananas")  
- "ad" often means "add" (e.g., "ad five tomatoes" = "add five tomatoes")

Extract ONLY the essential information. Focus on:
1. The action (add/remove/list/recipes)
2. The food item name (clean food name only - ignore filler words)
3. The quantity if specified

Respond with JSON in this exact format:
{
  "action": "add|remove|update|list|recipes|help",
  "item": "clean food item name only",
  "quantity": number (if specified, otherwise null),
  "unit": "unit type (if specified)",
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
      
      try {
        return JSON.parse(text);
      } catch {
        return this.fallbackParser(transcript);
      }
    } catch (error) {
      console.error('Gemini parsing error:', error);
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
    
    // Helper function to clean item names
    const cleanItemName = (itemText: string): string => {
      return itemText
        .replace(/\b(to|from|the|cart|kart|card|inventory|list|my|in|into|put|add|remove|delete|out|of)\b/g, '')
        .trim()
        .replace(/\s+/g, ' ');
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
      
      // Try explicit add/put commands with quantity words first
      let match = converted.match(/(?:add|put)\s+(\d+)\s+([a-zA-Z\s]+?)(?:\s+(?:to|into|in)\s+(?:the\s+)?(?:cart|kart|inventory|list))?$/);
      console.log('Match 1 (add/put with quantity):', match);
      
      if (match) {
        const itemName = cleanItemName(match[2]);
        console.log('Parsed - item:', itemName, 'quantity:', match[1]);
        return {
          action: 'add',
          item: itemName,
          quantity: parseInt(match[1]),
          unit: 'pieces',
          raw: transcript,
        };
      }
      
      // Try implicit commands starting with quantity (like "two bananas")
      match = converted.match(/^\s*(\d+)\s+([a-zA-Z\s]+?)(?:\s+(?:to|into|in)\s+(?:the\s+)?(?:cart|kart|inventory|list))?$/);
      
      if (match) {
        const itemName = cleanItemName(match[2]);
        return {
          action: 'add',
          item: itemName,
          quantity: parseInt(match[1]),
          unit: 'pieces',
          raw: transcript,
        };
      }
      
      // Finally, try explicit add/put commands without quantity
      match = converted.match(/(?:add|put)\s+([a-zA-Z\s]+?)(?:\s+(?:to|into|in)\s+(?:the\s+)?(?:cart|kart|inventory|list))?$/);
      
      if (match) {
        const itemName = cleanItemName(match[1]);
        return {
          action: 'add',
          item: itemName,
          quantity: 1,
          unit: 'pieces',
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
    if (!this.genAI) {
      return this.fallbackRecipes(inventory);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const inventoryList = inventory.map(item => `${item.name}: ${item.quantity} ${item.unit}`).join(', ');
      
      const prompt = `Based on this grocery inventory: ${inventoryList}

Generate 3 practical recipe suggestions. For each recipe, analyze which ingredients are available and which are missing.

Respond with JSON array:
[{
  "id": "unique-id",
  "name": "Recipe Name",
  "description": "Brief description",
  "ingredients": ["ingredient1", "ingredient2"],
  "instructions": ["step1", "step2"],
  "cookingTime": 30,
  "servings": 4,
  "availableIngredients": ["available items"],
  "missingIngredients": ["missing items"],
  "canMake": true/false
}]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch {
        return this.fallbackRecipes(inventory);
      }
    } catch (error) {
      console.error('Recipe generation error:', error);
      return this.fallbackRecipes(inventory);
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