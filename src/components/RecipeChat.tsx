import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  MicOff, 
  Loader2, 
  ChefHat, 
  User, 
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { geminiService } from '../services/geminiService';
import type { InventoryItem } from '../types';
import { clsx } from 'clsx';

interface RecipeChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isVoice?: boolean;
  recipe?: {
    name: string;
    description: string;
    cookingTime: number;
    servings: number;
    availableIngredients?: string[];
    missingIngredients?: string[];
    canMake?: boolean;
    ingredients: string[];
    instructions: string[];
    tips?: string[];
  };
}

interface RecipeChatProps {
  onClose: () => void;
  inventory: InventoryItem[];
}

export function RecipeChat({ onClose, inventory }: RecipeChatProps) {
  const [messages, setMessages] = useState<RecipeChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: '1',
      content: "Hi! I'm your recipe assistant. Tell me what you'd like to cook, and I'll create a recipe using your available ingredients. You can ask for specific cuisines, dietary preferences, or cooking methods!",
      isUser: false,
      timestamp: new Date(),
    }]);
  }, []);

  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    onResult: (text: string) => {
      setInputMessage(text);
      setIsVoiceActive(false);
      resetTranscript();
    },
    onError: (error: string) => {
      console.error('Voice recognition error:', error);
      setIsVoiceActive(false);
    },
    onStart: () => {
      setIsVoiceActive(true);
    },
    onEnd: () => {
      setIsVoiceActive(false);
    },
    language: 'en-US',
    continuous: false,
  });

  // Fallback recipe creation when Gemini API is not available
  const createFallbackRecipe = (request: string, inventory: InventoryItem[]) => {
    const lowerRequest = request.toLowerCase();
    
    // Simple recipe matching based on keywords
    if (lowerRequest.includes('pasta')) {
      return {
        name: "Simple Pasta Recipe",
        description: "A basic pasta dish using available ingredients",
        cookingTime: 20,
        servings: 2,
        ingredients: ["pasta", "water", "salt", "oil"],
        availableIngredients: inventory.slice(0, 2).map(item => item.name),
        missingIngredients: ["pasta", "olive oil"],
        instructions: [
          "Boil water with salt",
          "Add pasta and cook for 8-10 minutes",
          "Drain and serve with available ingredients"
        ],
        canMake: inventory.length > 0,
        tips: ["Add any available vegetables for extra flavor"]
      };
    }
    
    if (lowerRequest.includes('egg')) {
      return {
        name: "Simple Egg Dish",
        description: "A quick egg-based meal",
        cookingTime: 10,
        servings: 1,
        ingredients: ["2 eggs", "salt", "pepper", "oil"],
        availableIngredients: inventory.filter(item => 
          item.name.toLowerCase().includes('egg') || 
          item.name.toLowerCase().includes('milk')
        ).map(item => item.name),
        missingIngredients: ["salt", "pepper"],
        instructions: [
          "Beat eggs in a bowl",
          "Heat oil in pan",
          "Cook eggs to your preference"
        ],
        canMake: inventory.some(item => item.name.toLowerCase().includes('egg')),
        tips: ["Add milk for fluffier eggs"]
      };
    }
    
    // Generic fallback
    return {
      name: "Custom Recipe",
      description: `A recipe based on your request: "${request}"`,
      cookingTime: 30,
      servings: 2,
      ingredients: ["Various ingredients"],
      availableIngredients: inventory.slice(0, 3).map(item => item.name),
      missingIngredients: ["Additional ingredients as needed"],
      instructions: [
        "Use your available ingredients creatively",
        "Follow basic cooking principles",
        "Adjust seasoning to taste"
      ],
      canMake: inventory.length > 0,
      tips: ["Experiment with flavors you enjoy"]
    };
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const generateRecipeFromRequest = async (request: string) => {
    const inventoryList = inventory.map(item => `${item.name}: ${item.quantity} ${item.unit}`).join(', ');
    
    const prompt = `User request: "${request}"
Available inventory: ${inventoryList}

Create a detailed recipe that:
1. Matches the user's request as closely as possible
2. Uses as many available ingredients as possible
3. Clearly indicates which ingredients are available vs missing
4. Provides step-by-step instructions
5. Includes cooking time and servings

IMPORTANT: If the request is too vague (like just "hi" or "hello"), ask for more specific details about what they want to cook.

Respond with JSON:
{
  "name": "Recipe Name",
  "description": "Brief description",
  "cookingTime": 30,
  "servings": 4,
  "ingredients": ["ingredient1 (2 cups)", "ingredient2 (1 lb)"],
  "availableIngredients": ["ingredients you have"],
  "missingIngredients": ["ingredients you need to buy"],
  "instructions": ["detailed step 1", "detailed step 2"],
  "tips": ["helpful cooking tip 1", "helpful cooking tip 2"],
  "canMake": true/false
}`;

    try {
      console.log('Sending prompt to Gemini:', prompt);
      
      // Check if the method exists
      if (!geminiService.generateRecipeFromPrompt) {
        console.error('generateRecipeFromPrompt method does not exist on geminiService');
        return null;
      }
      
      // Use the generateRecipeFromPrompt method we added to geminiService
      const response = await geminiService.generateRecipeFromPrompt(prompt);
      console.log('Recipe generated:', response);
      
      // Even if we get a response, make sure it has the required fields
      if (response && typeof response === 'object') {
        return response;
      } else {
        console.error('Invalid response format:', response);
        return null;
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
      console.error('Error details:', error);
      
      // Check if it's an API key issue
      if (error instanceof Error && error.message && error.message.includes('Gemini AI not available')) {
        console.error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment.');
        
        // Return a fallback recipe when API is not available
        return createFallbackRecipe(request, inventory);
      }
      
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const message = inputMessage.trim();
    const isVoiceMessage = isVoiceActive;
    setInputMessage('');
    setIsProcessing(true);

    // Add user message
    const userMessage: RecipeChatMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date(),
      isVoice: isVoiceMessage,
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Handle simple greetings
      const lowerMessage = message.toLowerCase().trim();
      if (['hi', 'hello', 'hey', 'yo'].includes(lowerMessage)) {
        const responseContent = "Hello! I'm ready to help you create recipes using your available ingredients. What would you like to cook today? You can ask for:\n\n• Specific dishes (\"make me pasta\")\n• Cuisine types (\"something Italian\")\n• Dietary preferences (\"vegetarian meal\")\n• Cooking methods (\"something quick and easy\")\n\nWhat sounds good to you?";
        
        const assistantMessage: RecipeChatMessage = {
          id: (Date.now() + 1).toString(),
          content: responseContent,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        return;
      }

      // Generate recipe from request
      const recipe = await generateRecipeFromRequest(message);
      
      let responseContent = '';
      if (recipe && recipe.name && recipe.name !== 'Custom Recipe') {
        responseContent = `I've created a recipe for you! Here's **${recipe.name}**:

${recipe.description}

**Cooking Time:** ${recipe.cookingTime} minutes | **Servings:** ${recipe.servings}

**Ingredients you have:** ${recipe.availableIngredients?.join(', ') || 'None'}
**Ingredients you need:** ${recipe.missingIngredients?.join(', ') || 'None'}

${recipe.canMake ? '✅ You can make this now!' : '🛒 You\'ll need to shop for some ingredients first.'}

Would you like me to show the full instructions?`;
      } else {
        responseContent = "I had trouble creating a recipe for that request. Could you be more specific? For example, you could say:\n\n• 'Make me a pasta dish'\n• 'I want something with eggs'\n• 'Show me a quick breakfast recipe'\n• 'I need a vegetarian dinner'\n\nWhat type of dish are you interested in?";
      }

      // Add assistant response
      const assistantMessage: RecipeChatMessage = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        isUser: false,
        timestamp: new Date(),
        recipe: recipe,
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error processing recipe request:', error);
      const errorMessage: RecipeChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I had trouble processing that request. Please try again!",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const showFullRecipe = (recipe: NonNullable<RecipeChatMessage['recipe']>) => {
    const fullRecipeMessage: RecipeChatMessage = {
      id: Date.now().toString(),
      content: `**${recipe.name} - Full Recipe**

**Ingredients:**
${recipe.ingredients.map((ing: string, index: number) => `${index + 1}. ${ing}`).join('\n')}

**Instructions:**
${recipe.instructions.map((step: string, index: number) => `${index + 1}. ${step}`).join('\n')}

${recipe.tips ? `**Tips:**\n${recipe.tips.map((tip: string) => `• ${tip}`).join('\n')}` : ''}`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, fullRecipeMessage]);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-white/20 p-2 rounded-xl">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Recipe Chat</h3>
              <p className="text-purple-100 text-sm">Ask for any recipe you want!</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-200 animate-pulse" />
            <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
              {inventory.length} ingredients
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx('flex animate-slide-up', {
              'justify-end': message.isUser,
              'justify-start': !message.isUser,
            })}
          >
            <div className={clsx('max-w-xs lg:max-w-md', {
              'ml-auto': message.isUser,
              'mr-auto': !message.isUser,
            })}>
              <div
                className={clsx('px-4 py-3 rounded-2xl shadow-md', {
                  'bg-gradient-to-r from-purple-500 to-pink-500 text-white': message.isUser,
                  'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800': !message.isUser,
                })}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {message.isUser ? (
                      <div className="flex items-center space-x-1 p-1 rounded-lg bg-white/20">
                        {message.isVoice && <Mic className="w-3 h-3" />}
                        <User className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                        <ChefHat className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-relaxed break-words whitespace-pre-line">
                      {message.content}
                    </div>
                    
                    {/* Recipe Actions */}
                    {message.recipe && (
                      <div className="mt-3 space-y-2">
                        <button
                          onClick={() => message.recipe && showFullRecipe(message.recipe)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                        >
                          Show Full Recipe
                        </button>
                        
                        {/* Ingredient Status */}
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-gray-600">
                              {message.recipe.availableIngredients?.length || 0} available
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <XCircle className="w-3 h-3 text-red-600" />
                            <span className="text-gray-600">
                              {message.recipe.missingIngredients?.length || 0} missing
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className={clsx('text-xs', {
                        'text-purple-200': message.isUser,
                        'text-gray-500': !message.isUser,
                      })}>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {message.isVoice && (
                        <div className={clsx('flex items-center space-x-1 text-xs', {
                          'text-purple-200': message.isUser,
                          'text-gray-500': !message.isUser,
                        })}>
                          <Mic className="w-3 h-3" />
                          <span>Voice</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl shadow-md">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span className="text-sm text-gray-600">Creating your recipe...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-white">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask for any recipe... e.g., 'make me a healthy pasta dish'"
            disabled={isProcessing}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
          />
          
          {isSupported && (
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={isProcessing}
              className={clsx(
                'p-3 rounded-2xl transition-all duration-200 flex items-center justify-center',
                {
                  'bg-red-500 text-white hover:bg-red-600 animate-pulse': isListening,
                  'bg-gray-200 text-gray-600 hover:bg-gray-300': !isListening && !isProcessing,
                  'bg-gray-300 text-gray-500 cursor-not-allowed': isProcessing,
                }
              )}
              title={isListening ? 'Stop Recording' : 'Start Voice Recording'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          
          <button
            type="submit"
            disabled={!inputMessage.trim() || isProcessing}
            className={clsx(
              'p-3 rounded-2xl transition-all duration-200 flex items-center justify-center',
              {
                'bg-purple-500 text-white hover:bg-purple-600 hover:scale-105': inputMessage.trim() && !isProcessing,
                'bg-gray-300 text-gray-500 cursor-not-allowed': !inputMessage.trim() || isProcessing,
              }
            )}
            title="Send Message"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        
        {transcript && (
          <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-xl">
            <p className="text-sm text-purple-700 italic">"{transcript}"</p>
          </div>
        )}
      </div>
    </div>
  );
}