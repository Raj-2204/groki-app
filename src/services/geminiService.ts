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

Extract the action and details. Respond with JSON in this exact format:
{
  "action": "add|remove|update|list|recipes|help",
  "item": "item name (if applicable)",
  "quantity": number (if specified),
  "unit": "unit type (if specified)",
  "raw": "${transcript}"
}

Examples:
- "add 3 apples" → {"action": "add", "item": "apples", "quantity": 3, "unit": "pieces", "raw": "add 3 apples"}
- "remove milk" → {"action": "remove", "item": "milk", "raw": "remove milk"}
- "show recipes" → {"action": "recipes", "raw": "show recipes"}
- "what's in my inventory" → {"action": "list", "raw": "what's in my inventory"}`;

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
    const lower = transcript.toLowerCase().trim();
    
    // Add command
    if (lower.includes('add') || lower.includes('put')) {
      const match = lower.match(/(?:add|put)\s+(\d+)?\s*([a-zA-Z\s]+)/);
      if (match) {
        return {
          action: 'add',
          item: match[2].trim(),
          quantity: match[1] ? parseInt(match[1]) : 1,
          unit: 'pieces',
          raw: transcript,
        };
      }
    }
    
    // Remove command
    if (lower.includes('remove') || lower.includes('delete')) {
      const match = lower.match(/(?:remove|delete)\s+([a-zA-Z\s]+)/);
      if (match) {
        return {
          action: 'remove',
          item: match[1].trim(),
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