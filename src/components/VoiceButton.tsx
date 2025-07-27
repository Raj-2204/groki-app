import { useState } from 'react';
import { Mic, MicOff, Loader2, Volume2, Waves, Power, PowerOff } from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useInventoryStore } from '../store/inventoryStore';
import { geminiService } from '../services/geminiService';
import { clsx } from 'clsx';

export function VoiceButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [alwaysListening, setAlwaysListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Click to enable always listening');
  
  const { addItem, removeItem, findItemByName, addMessage } = useInventoryStore();

  const {
    isListening,
    transcript,
    confidence,
    isSupported,
    isWaitingForWakeWord,
    isActivelyListening,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    alwaysListening,
    wakeWords: ['hey google', 'google'],
    onWakeWordDetected: () => {
      setStatusMessage('Wake word detected! Say your command (10 seconds)...');
    },
    onResult: async (text: string) => {
      setIsProcessing(true);
      setStatusMessage('Processing...');
      
      try {
        // Add user message to chat
        await addMessage(text, true, true);
        
        // Parse the command using Gemini AI
        const command = await geminiService.parseVoiceCommand(text);
        
        let responseMessage = '';
        
        switch (command.action) {
          case 'add':
            if (command.item && command.quantity) {
              await addItem(command.item, command.quantity, command.unit || 'pieces');
              responseMessage = `Added ${command.quantity} ${command.item} to your inventory!`;
            } else {
              responseMessage = "I couldn't understand what item to add. Try saying 'add 3 apples'.";
            }
            break;
            
          case 'remove':
            if (command.item) {
              const existingItem = findItemByName(command.item);
              if (existingItem) {
                await removeItem(existingItem.id);
                responseMessage = `Removed ${command.item} from your inventory.`;
              } else {
                responseMessage = `I couldn't find ${command.item} in your inventory.`;
              }
            } else {
              responseMessage = "I couldn't understand what item to remove. Try saying 'remove milk'.";
            }
            break;
            
          case 'list':
            responseMessage = "Here's your current inventory. Check the list on the right!";
            break;
            
          case 'recipes':
            responseMessage = "Let me suggest some recipes based on your ingredients!";
            break;
            
          default:
            responseMessage = "I can help you add items, remove items, show your inventory, or suggest recipes. What would you like to do?";
        }
        
        // Add assistant response to chat
        await addMessage(responseMessage, false);
        if (alwaysListening) {
          setStatusMessage('Listening for "Hey Google"...');
        } else {
          setStatusMessage('Done!');
        }
        
      } catch (error) {
        console.error('Error processing voice command:', error);
        await addMessage("Sorry, I had trouble processing that command. Please try again.", false);
        setStatusMessage('Error occurred');
      } finally {
        setIsProcessing(false);
        resetTranscript();
        if (alwaysListening) {
          setTimeout(() => setStatusMessage('Listening for "Hey Groki"...'), 2000);
        } else {
          setTimeout(() => setStatusMessage('Click to speak'), 2000);
        }
      }
    },
    onError: (error: string) => {
      console.error('Voice recognition error:', error);
      setStatusMessage('Voice error');
      setTimeout(() => setStatusMessage('Click to speak'), 2000);
    },
    onStart: () => {
      if (alwaysListening) {
        setStatusMessage('Listening for "Hey Google"...');
      } else {
        setStatusMessage('Listening...');
      }
    },
    onEnd: () => {
      if (!isProcessing && !alwaysListening) {
        setStatusMessage('Click to speak');
      }
    },
    language: 'en-US',
    continuous: false,
  });

  const handleToggleAlwaysListening = () => {
    console.log('Toggling always listening, current state:', alwaysListening);
    if (alwaysListening) {
      setAlwaysListening(false);
      stopListening();
      setStatusMessage('Click to enable always listening');
    } else {
      setAlwaysListening(true);
      setStatusMessage('Starting always listening...');
      // Wait a moment for state to update, then start listening
      setTimeout(() => {
        console.log('Starting listening with alwaysListening:', true);
        startListening();
      }, 100);
    }
  };

  const handleToggleListening = () => {
    if (alwaysListening) {
      handleToggleAlwaysListening();
    } else {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">Voice recognition is not supported in this browser.</p>
        <p className="text-sm text-gray-500 mt-2">Try using Chrome, Safari, or Edge.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Always Listening Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleToggleAlwaysListening}
          className={clsx(
            'flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium',
            {
              'bg-green-100 text-green-700 hover:bg-green-200': alwaysListening,
              'bg-gray-100 text-gray-600 hover:bg-gray-200': !alwaysListening,
            }
          )}
        >
          {alwaysListening ? (
            <>
              <Power className="w-4 h-4" />
              <span>Always Listening ON</span>
            </>
          ) : (
            <>
              <PowerOff className="w-4 h-4" />
              <span>Always Listening OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Enhanced Voice Button */}
      <div className="relative">
        <button
          onClick={handleToggleListening}
          disabled={isProcessing}
          className={clsx(
            'relative w-24 h-24 rounded-full transition-all duration-500 transform focus:outline-none group',
            {
              'bg-gradient-to-r from-green-500 to-green-600 shadow-glow-lg hover:shadow-glow animate-glow scale-110': isWaitingForWakeWord,
              'bg-gradient-to-r from-red-500 to-red-600 shadow-glow-lg hover:shadow-glow animate-glow scale-110': isActivelyListening || (isListening && !alwaysListening),
              'bg-gradient-to-r from-primary-500 to-accent-500 shadow-xl hover:shadow-glow-lg hover:scale-110': !isListening && !isProcessing && !isWaitingForWakeWord,
              'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed': isProcessing,
            }
          )}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/10 to-white/5 opacity-50"></div>
          
          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {isProcessing ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : isWaitingForWakeWord ? (
              <div className="flex flex-col items-center">
                <Waves className="w-8 h-8 text-white animate-pulse" />
                <div className="text-xs text-white/80 mt-1">Wake</div>
              </div>
            ) : isActivelyListening ? (
              <div className="flex items-center space-x-1">
                <MicOff className="w-10 h-10 text-white animate-pulse" />
              </div>
            ) : isListening ? (
              <div className="flex items-center space-x-1">
                <MicOff className="w-10 h-10 text-white animate-pulse" />
              </div>
            ) : (
              <Mic className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-200" />
            )}
          </div>
          
          {/* Multiple Ripple Effects */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping"></span>
              <span className="absolute inset-0 rounded-full bg-white opacity-10 animate-ping" style={{ animationDelay: '0.5s' }}></span>
              <span className="absolute inset-0 rounded-full bg-red-300 opacity-30 animate-pulse"></span>
            </>
          )}
          
          {/* Hover Glow Effect */}
          {!isListening && !isProcessing && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-sm"></div>
          )}
        </button>

        {/* Sound Waves Animation */}
        {isListening && (
          <div className="absolute -inset-8 flex items-center justify-center pointer-events-none">
            <Waves className="w-16 h-16 text-red-300 opacity-60 animate-pulse" />
          </div>
        )}
      </div>

      {/* Enhanced Status Display */}
      <div className="text-center min-h-[4rem] max-w-sm">
        <div className={clsx(
          'inline-flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300',
          {
            'bg-green-100 text-green-700': isWaitingForWakeWord,
            'bg-red-100 text-red-700': isActivelyListening || (isListening && !alwaysListening),
            'bg-primary-100 text-primary-700': !isListening && !isProcessing && !isWaitingForWakeWord,
            'bg-gray-100 text-gray-600': isProcessing,
          }
        )}>
          {isListening && <Volume2 className="w-4 h-4 animate-pulse" />}
          <p className="text-sm font-semibold">{statusMessage}</p>
          {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
        
        {/* Enhanced Transcript Display */}
        {transcript && (
          <div className="mt-3 p-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md animate-slide-down">
            <p className="text-sm text-gray-700 italic">
              "{transcript}"
            </p>
            {confidence > 0 && (
              <div className="mt-2 flex items-center justify-center space-x-2">
                <div className="h-1 bg-gray-200 rounded-full w-16">
                  <div 
                    className="h-1 bg-primary-500 rounded-full transition-all duration-300"
                    style={{ width: `${confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Minimalist Help Text */}
      <div className="text-center">
        <p className="text-xs text-gray-500 font-medium">
          {isWaitingForWakeWord ? 'Say "Hey Google" to start' : 
           isActivelyListening ? 'Give your command now' :
           isListening ? 'Listening... speak now' : 
           alwaysListening ? 'Always listening mode active' : 'Click to speak or enable always listening'}
        </p>
      </div>
    </div>
  );
}