// Core types for our grocery assistant
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  expiryDate?: Date;
  isLowStock?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  availableIngredients: string[];
  missingIngredients: string[];
  canMake: boolean;
}

export interface VoiceCommand {
  action: 'add' | 'remove' | 'update' | 'list' | 'recipes' | 'help';
  item?: string;
  quantity?: number;
  unit?: string;
  raw: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isVoice?: boolean;
}

export interface VoiceRecognitionOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onWakeWordDetected?: () => void;
  language?: string;
  continuous?: boolean;
  wakeWords?: string[];
  alwaysListening?: boolean;
}