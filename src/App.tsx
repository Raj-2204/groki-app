import React from 'react';
import { Mic, ShoppingCart, Sparkles, Brain, Volume2, LogOut, User } from 'lucide-react';
import { VoiceButton } from './components/VoiceButton';
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-success-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-3 rounded-2xl shadow-glow animate-glow">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success-400 rounded-full animate-pulse">
                  <Volume2 className="w-3 h-3 text-white m-0.5" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Voice Grocery Assistant
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Brain className="w-4 h-4 text-primary-500" />
                  <p className="text-sm text-gray-600 font-medium">Powered by AI & Voice Recognition</p>
                  <Sparkles className="w-4 h-4 text-accent-500 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                <ShoppingCart className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-semibold text-gray-700">{getItemCount()} items</span>
              </div>
              
              {/* User Menu */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                  <User className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">{user?.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full px-4 py-2 transition-colors shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
              
              <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
                <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Control Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full px-4 py-2 mb-4">
                  <Mic className="w-4 h-4 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-800">Voice Control</h2>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Click the button below and speak your commands naturally
                </p>
              </div>
              <VoiceButton />
            </div>

            {/* Enhanced Tips Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center space-x-2 mb-6">
                <Sparkles className="w-5 h-5 text-accent-500" />
                <h3 className="text-lg font-bold text-gray-800">Quick Commands</h3>
              </div>
              <div className="space-y-4">
                <div className="group flex items-start space-x-4 p-3 rounded-2xl hover:bg-success-50 transition-all duration-200">
                  <div className="bg-gradient-to-r from-success-400 to-success-500 p-2 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Add items</p>
                    <p className="text-xs text-gray-600">"Add 3 apples to my list"</p>
                  </div>
                </div>
                <div className="group flex items-start space-x-4 p-3 rounded-2xl hover:bg-red-50 transition-all duration-200">
                  <div className="bg-gradient-to-r from-red-400 to-red-500 p-2 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Remove items</p>
                    <p className="text-xs text-gray-600">"Remove milk from inventory"</p>
                  </div>
                </div>
                <div className="group flex items-start space-x-4 p-3 rounded-2xl hover:bg-primary-50 transition-all duration-200">
                  <div className="bg-gradient-to-r from-primary-400 to-primary-500 p-2 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Get recipes</p>
                    <p className="text-xs text-gray-600">"What can I cook?"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <ChatInterface />
          </div>

          {/* Inventory Section */}
          <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <InventoryList />
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="relative mt-20 bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Voice Grocery Assistant</h3>
            </div>
            <p className="text-primary-100 mb-6 max-w-2xl mx-auto leading-relaxed">
              Experience the future of grocery management with AI-powered voice commands. 
              Built with modern technologies for a seamless shopping experience.
            </p>
            <div className="flex flex-wrap items-center justify-center space-x-6 text-sm text-primary-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                <span>React & TypeScript</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span>Vite & Tailwind CSS</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-300 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <span>Google Gemini AI</span>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-center space-x-2 text-primary-100">
              <Mic className="w-4 h-4" />
              <span className="text-sm">Voice-powered grocery management made simple</span>
              <Volume2 className="w-4 h-4" />
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
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
