import { useState, useEffect, useCallback } from 'react';
import { 
  ChefHat, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  Sparkles, 
  RefreshCw, 
  MessageSquare,
  Heart,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';
import { geminiService } from '../services/geminiService';
import { RecipeChat } from './RecipeChat';
import type { Recipe } from '../types';
import { clsx } from 'clsx';

interface RecipeSuggestionsProps {
  onRecipeSelect?: (recipe: Recipe) => void;
}

export function RecipeSuggestions({ onRecipeSelect }: RecipeSuggestionsProps) {
  const { items } = useInventoryStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);


  const generateRecipes = useCallback(async () => {
    console.log('generateRecipes called, items length:', items.length);
    console.log('Current items:', items);
    
    if (items.length === 0) {
      console.log('No items available, skipping recipe generation');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Calling geminiService.generateRecipes with items:', items);
      const generatedRecipes = await geminiService.generateRecipes(items);
      console.log('Received recipes from gemini service:', generatedRecipes);
      setRecipes(generatedRecipes);
    } catch (error) {
      console.error('Error generating recipes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [items]);

  useEffect(() => {
    generateRecipes();
  }, [items, generateRecipes]);

  const getDifficultyColor = (cookingTime: number) => {
    if (cookingTime <= 15) return 'bg-green-100 text-green-800 border-green-200';
    if (cookingTime <= 45) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getDifficultyText = (cookingTime: number) => {
    if (cookingTime <= 15) return 'Easy';
    if (cookingTime <= 45) return 'Medium';
    return 'Hard';
  };

  if (showChat) {
    return (
      <RecipeChat 
        onClose={() => setShowChat(false)}
        inventory={items}
      />
    );
  }

  // Don't render the recipe detail page here - we'll handle it at App level

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Recipe Suggestions</h3>
              <p className="text-orange-100 text-sm">
                Based on your {items.length} ingredients
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChat(true)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors"
              title="Chat for specific recipes"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={generateRecipes}
              disabled={isLoading || items.length === 0}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors disabled:opacity-50"
              title="Refresh recipes"
            >
              <RefreshCw className={clsx('w-5 h-5', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">No ingredients yet</h4>
            <p className="text-gray-600 mb-4">
              Add some ingredients to your inventory to get recipe suggestions
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-orange-700 text-sm font-medium">
                💡 Try adding: eggs, milk, flour, or any ingredients you have!
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Cooking up recipes...</h4>
              <p className="text-gray-600">AI is analyzing your ingredients</p>
            </div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">No recipes found</h4>
            <p className="text-gray-600 mb-4">
              Try adding more ingredients or use the chat feature for specific requests
            </p>
            <button
              onClick={() => setShowChat(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Ask for Specific Recipe
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {recipes.map((recipe, index) => (
              <div
                key={recipe.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Recipe Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{recipe.name}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{recipe.description}</p>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Heart className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Recipe Meta */}
                  <div className="flex items-center space-x-6 mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{recipe.cookingTime} min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{recipe.servings} servings</span>
                    </div>
                    <span className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium border',
                      getDifficultyColor(recipe.cookingTime)
                    )}>
                      {getDifficultyText(recipe.cookingTime)}
                    </span>
                    {recipe.canMake && (
                      <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-xs font-medium">
                        Can Make Now!
                      </span>
                    )}
                  </div>

                  {/* Ingredients Status */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Ingredients</h4>
                    <div className="space-y-2">
                      {recipe.availableIngredients.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 mb-2">✓ You have:</p>
                          <div className="flex flex-wrap gap-2">
                            {recipe.availableIngredients.map((ingredient, idx) => (
                              <span
                                key={idx}
                                className="flex items-center space-x-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs border border-green-200"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>{ingredient}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {recipe.missingIngredients.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-700 mb-2">✗ You need:</p>
                          <div className="flex flex-wrap gap-2">
                            {recipe.missingIngredients.map((ingredient, idx) => (
                              <span
                                key={idx}
                                className="flex items-center space-x-1 bg-red-50 text-red-700 px-2 py-1 rounded-lg text-xs border border-red-200"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>{ingredient}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Instructions Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Instructions</h4>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <ol className="list-decimal list-inside space-y-2">
                        {recipe.instructions.slice(0, 3).map((instruction, idx) => (
                          <li key={idx} className="text-sm text-gray-700">
                            {instruction}
                          </li>
                        ))}
                        {recipe.instructions.length > 3 && (
                          <li className="text-sm text-gray-500 italic">
                            +{recipe.instructions.length - 3} more steps...
                          </li>
                        )}
                      </ol>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onRecipeSelect?.(recipe)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>View Full Recipe</span>
                    </button>
                    <button className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <ExternalLink className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}