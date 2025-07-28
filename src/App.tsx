import React from 'react';
import { Mic, ShoppingCart, Brain, Volume2, LogOut, User, Sparkles } from 'lucide-react';
import { InventoryList } from './components/InventoryList';
import { ChatInterface } from './components/ChatInterface';
import { AuthPage } from './components/AuthPage';
import { useInventoryStore } from './store/inventoryStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function MainApp() {
  const { getItemCount, initializeStore, clearStore } = useInventoryStore();
  const { user, signOut } = useAuth();

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

  return (
    <div className="h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 relative overflow-hidden flex flex-col">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-success-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Minimal Toolbar Header */}
      <header className="relative bg-white/90 backdrop-blur-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="relative">
                <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-0.5 rounded">
                  <Mic className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-success-400 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-xs font-bold text-gray-800">Groki</h1>
              <div className="flex items-center space-x-0.5">
                <Brain className="w-1.5 h-1.5 text-primary-500" />
                <span className="text-xs text-gray-500">AI</span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center space-x-0.5 bg-gray-100 rounded px-1 py-0.5">
                <ShoppingCart className="w-2 h-2 text-primary-600" />
                <span className="text-xs font-medium text-gray-700">{getItemCount()}</span>
              </div>
              <div className="flex items-center space-x-0.5 bg-gray-100 rounded px-1 py-0.5">
                <User className="w-2 h-2 text-primary-600" />
                <span className="text-xs text-gray-700 whitespace-nowrap">{user?.email?.split('@')[0]}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center space-x-0.5 bg-red-100 hover:bg-red-200 text-red-700 rounded px-1.5 py-0.5 transition-colors"
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
      <main className="relative flex-1 max-w-7xl mx-auto px-3 py-2 overflow-hidden">
        {/* Chat and Inventory Side by Side - Fill remaining height */}
        <div className="flex flex-row gap-4 h-full">
          {/* Chat Section */}
          <div className="w-1/2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <ChatInterface />
          </div>

          {/* Inventory Section */}
          <div className="w-1/2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <InventoryList />
          </div>
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 flex-shrink-0">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-center space-x-4 text-center">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-1 rounded-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Voice Grocery Assistant</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-primary-200">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-success-400 rounded-full animate-pulse"></div>
                <span>React & TypeScript</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
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
      <div className="h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  return user ? <MainApp /> : <AuthPage />;
}

export default App;
