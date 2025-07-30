import { 
  ArrowLeft, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  ChefHat,
  Heart,
  Share2,
  Printer
} from 'lucide-react';
import type { Recipe } from '../types';
import { clsx } from 'clsx';

interface RecipeDetailPageProps {
  recipe: Recipe;
  onBack: () => void;
}

export function RecipeDetailPage({ recipe, onBack }: RecipeDetailPageProps) {

  const getDifficultyText = (cookingTime: number) => {
    if (cookingTime <= 15) return 'Easy';
    if (cookingTime <= 45) return 'Medium';
    return 'Hard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Recipes</span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Recipe Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3">{recipe.name}</h1>
                <p className="text-orange-100 text-lg leading-relaxed mb-6">
                  {recipe.description}
                </p>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-orange-200" />
                    <span className="font-medium">{recipe.cookingTime} minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-orange-200" />
                    <span className="font-medium">{recipe.servings} servings</span>
                  </div>
                  <span className={clsx(
                    'px-3 py-1 rounded-full text-sm font-medium border bg-white/20 text-white border-white/30'
                  )}>
                    {getDifficultyText(recipe.cookingTime)}
                  </span>
                  {recipe.canMake && (
                    <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-sm font-medium">
                      Can Make Now!
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-6">
                <div className="bg-white/20 p-4 rounded-2xl">
                  <ChefHat className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Ingredients Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="bg-orange-100 p-2 rounded-lg mr-3">
                    <ChefHat className="w-5 h-5 text-orange-600" />
                  </div>
                  Ingredients
                </h2>

                <div className="space-y-6">
                  {recipe.availableIngredients.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        You have ({recipe.availableIngredients.length})
                      </h3>
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <ul className="space-y-2">
                          {recipe.availableIngredients.map((ingredient, idx) => (
                            <li key={idx} className="flex items-center space-x-3">
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <span className="text-green-800 font-medium">{ingredient}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {recipe.missingIngredients.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                        <XCircle className="w-5 h-5 mr-2" />
                        You need ({recipe.missingIngredients.length})
                      </h3>
                      <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                        <ul className="space-y-2">
                          {recipe.missingIngredients.map((ingredient, idx) => (
                            <li key={idx} className="flex items-center space-x-3">
                              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                              <span className="text-red-800 font-medium">{ingredient}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* All Ingredients */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">All Ingredients</h3>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <ul className="space-y-2">
                        {recipe.ingredients.map((ingredient, idx) => (
                          <li key={idx} className="flex items-center space-x-3">
                            {recipe.availableIngredients.includes(ingredient) ? (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                            <span className="text-gray-700">{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  Instructions
                </h2>

                <div className="space-y-4">
                  {recipe.instructions.map((instruction, idx) => (
                    <div key={idx} className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 leading-relaxed text-lg">{instruction}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tips Section */}
                {recipe.tips && recipe.tips.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 Pro Tips</h3>
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                      <ul className="space-y-2">
                        {recipe.tips.map((tip: string, idx: number) => (
                          <li key={idx} className="text-yellow-800 text-sm">
                            • {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}