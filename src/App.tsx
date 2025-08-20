import React, { useState } from 'react';
import { Mic, ShoppingCart, Brain, Volume2, LogOut, User, Sparkles } from 'lucide-react';
import { InventoryList } from './components/InventoryList';
import { ChatInterface } from './components/ChatInterface';
import { RecipeSuggestions } from './components/RecipeSuggestions';
import { RecipeDetailPage } from './components/RecipeDetailPage';
import { TabNavigation, type TabType } from './components/TabNavigation';
import { AuthPage } from './components/AuthPage';
import { useInventoryStore } from './store/inventoryStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { Recipe } from './types';
import './components/auth-forms.css';

function MainApp() {
  const { getItemCount, initializeStore, clearStore } = useInventoryStore();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Initialize store when user logs in
  React.useEffect(() => {
    if (user?.id) {
      initializeStore(user.id);
    }
    
    // Cleanup when user logs out
    return () => {
      clearStore();
    };
  }, [user?.id, initializeStore, clearStore]);

  // If a recipe is selected, show the recipe detail page
  if (selectedRecipe) {
    return (
      <RecipeDetailPage 
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
      />
    );
  }

  return (
    <div className="app-container flex flex-col">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full filter blur-xl opacity-20" style={{background: 'linear-gradient(45deg, rgba(0,212,255,0.3) 0%, rgba(52,9,121,0.3) 100%)', animation: 'float 6s ease-in-out infinite'}}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full filter blur-xl opacity-20" style={{background: 'linear-gradient(45deg, rgba(52,9,121,0.3) 0%, rgba(2,0,36,0.3) 100%)', animation: 'float 8s ease-in-out infinite', animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 rounded-full filter blur-xl opacity-20" style={{background: 'linear-gradient(45deg, rgba(0,212,255,0.2) 0%, rgba(52,9,121,0.2) 100%)', animation: 'float 10s ease-in-out infinite', animationDelay: '4s'}}></div>
      </div>

      {/* Minimal Toolbar Header */}
      <header className="relative app-header flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="relative">
                <div style={{background: 'linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(52,9,121,1) 37%, rgba(0,212,255,1) 94%)'}} className="p-0.5 rounded">
                  <Mic className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-success-400 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-xs font-bold text-white">Groki</h1>
              <div className="flex items-center space-x-0.5">
                <Brain className="w-1.5 h-1.5 text-cyan-400" />
                <span className="text-xs text-cyan-300">AI</span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center space-x-0.5 bg-white/10 rounded px-1 py-0.5">
                <ShoppingCart className="w-2 h-2 text-cyan-400" />
                <span className="text-xs font-medium text-white">{getItemCount()}</span>
              </div>
              <div className="flex items-center space-x-0.5 bg-white/10 rounded px-1 py-0.5">
                <User className="w-2 h-2 text-cyan-400" />
                <span className="text-xs text-white whitespace-nowrap">{user?.email?.split('@')[0]}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center space-x-0.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded px-1.5 py-0.5 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-2 h-2" />
                <span className="text-xs whitespace-nowrap">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Flex 1 to fill remaining space */}
      <main className="relative flex-1 max-w-7xl mx-auto px-3 py-2 overflow-hidden app-main">
        {/* Chat and Content Side by Side - Fill remaining height */}
        <div className="flex flex-row gap-4 h-full">
          {/* Chat Section */}
          <div className="w-1/2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <ChatInterface />
          </div>

          {/* Content Section with Tabs */}
          <div className="w-1/2 flex flex-col animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {/* Tab Navigation */}
            <TabNavigation 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              itemCount={getItemCount()}
            />

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'inventory' ? (
                <InventoryList />
              ) : (
                <RecipeSuggestions onRecipeSelect={setSelectedRecipe} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="relative app-footer flex-shrink-0">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-center space-x-4 text-center">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-1 rounded-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-semibold text-white" style={{fontFamily: 'monospace, serif'}}>Voice Grocery Assistant</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-cyan-200" style={{fontFamily: 'monospace, serif'}}>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                <span>React & TypeScript</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span>Gemini AI</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mic className="w-3 h-3" />
                <span>Voice-powered</span>
                <Volume2 className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-container flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div style={{background: 'linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(52,9,121,1) 37%, rgba(0,212,255,1) 94%)'}} className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white" style={{fontFamily: 'monospace, serif'}}>Loading...</h2>
        </div>
      </div>
    );
  }

  return user ? <MainApp /> : <AuthPage />;
}

export default App;
