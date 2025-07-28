import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Mic, User, Volume2, Brain, Send, MicOff, Loader2, Power, PowerOff, Waves } from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { geminiService } from '../services/geminiService';
import { clsx } from 'clsx';

// Always Listening Toggle Component
function AlwaysListeningToggle({ alwaysListening, onToggle, isListening }: {
  alwaysListening: boolean;
  onToggle: () => void;
  isListening: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'flex items-center space-x-1 px-2 py-1 rounded-full transition-all duration-200 text-xs',
        {
          'bg-green-100 text-green-700 hover:bg-green-200': alwaysListening,
          'bg-gray-100 text-gray-600 hover:bg-gray-200': !alwaysListening,
        }
      )}
      title={alwaysListening ? 'Disable Always Listening' : 'Enable Always Listening'}
    >
      {alwaysListening ? (
        <>
          <Power className="w-3 h-3" />
          {isListening && <Waves className="w-3 h-3 animate-pulse" />}
        </>
      ) : (
        <PowerOff className="w-3 h-3" />
      )}
      <span>{alwaysListening ? 'Always On' : 'Always Off'}</span>
    </button>
  );
}

// Mini Voice Button Component
function MiniVoiceButton({ alwaysListening, onAlwaysListeningChange }: {
  alwaysListening: boolean;
  onAlwaysListeningChange: (enabled: boolean) => void;
}) {
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const { addItem, reduceItemQuantity, addMessage } = useInventoryStore();

  const {
    isListening,
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
      // Wake word detected, actively listening now
    },
    onResult: async (text: string) => {
      setIsVoiceProcessing(true);
      
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
              try {
                await reduceItemQuantity(command.item, command.quantity);
                const quantityText = command.quantity ? `${command.quantity} ` : '';
                responseMessage = `Removed ${quantityText}${command.item} from your inventory.`;
              } catch (error) {
                responseMessage = `I couldn't find ${command.item} in your inventory.`;
              }
            } else {
              responseMessage = "I couldn't understand what item to remove. Try saying 'remove milk' or 'remove 2 apples'.";
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
        
      } catch (error) {
        console.error('Error processing voice command:', error);
        await addMessage("Sorry, I had trouble processing that command. Please try again.", false);
      } finally {
        setIsVoiceProcessing(false);
        resetTranscript();
      }
    },
    onError: (error: string) => {
      console.error('Voice recognition error:', error);
      setIsVoiceProcessing(false);
    },
    onStart: () => {
      console.log('Voice recognition started');
    },
    onEnd: () => {
      console.log('Voice recognition ended');
      if (!alwaysListening) {
        setIsVoiceProcessing(false);
      }
    },
    language: 'en-US',
    continuous: false,
  });

  const handleVoiceToggle = () => {
    console.log('Voice toggle clicked. Current state:', { alwaysListening, isListening, isSupported });
    
    if (alwaysListening) {
      // If always listening is on, turn it off
      console.log('Turning off always listening');
      onAlwaysListeningChange(false);
      stopListening();
    } else {
      // Manual voice recording toggle
      if (isListening) {
        console.log('Stopping manual recording');
        stopListening();
      } else {
        console.log('Starting manual recording');
        startListening();
      }
    }
  };

  // Handle always listening toggle
  useEffect(() => {
    console.log('Always listening effect triggered:', alwaysListening);
    if (alwaysListening) {
      console.log('Starting listening due to always listening toggle');
      // Use a small delay to ensure state is properly set
      setTimeout(() => {
        startListening();
      }, 100);
    } else if (!alwaysListening && isListening) {
      console.log('Stopping listening due to always listening toggle');
      stopListening();
    }
  }, [alwaysListening]);

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-2 rounded-full bg-gray-200 text-gray-400 cursor-not-allowed"
        title="Voice recognition not supported"
      >
        <Mic className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleVoiceToggle}
      disabled={isVoiceProcessing}
      className={clsx(
        'p-2 rounded-full transition-all duration-200 flex items-center justify-center',
        {
          'bg-green-500 text-white hover:bg-green-600 animate-pulse': isWaitingForWakeWord,
          'bg-red-500 text-white hover:bg-red-600 animate-pulse': isActivelyListening || (isListening && !alwaysListening),
          'bg-gray-200 text-gray-600 hover:bg-gray-300': !isListening && !isVoiceProcessing && !isWaitingForWakeWord,
          'bg-gray-300 text-gray-500 cursor-not-allowed': isVoiceProcessing,
        }
      )}
      title={
        isWaitingForWakeWord ? 'Listening for "Hey Google"' :
        isActivelyListening ? 'Recording your command' :
        isListening ? 'Stop Recording' : 'Start Voice Recording'
      }
    >
      {isVoiceProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isWaitingForWakeWord ? (
        <Waves className="w-4 h-4" />
      ) : isActivelyListening || (isListening && !alwaysListening) ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}

export function ChatInterface() {
  const { messages, addItem, reduceItemQuantity, addMessage } = useInventoryStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alwaysListening, setAlwaysListening] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setIsProcessing(true);

    try {
      // Add user message to chat
      await addMessage(message, true, false);
      
      // Parse the command using Gemini AI
      const command = await geminiService.parseVoiceCommand(message);
      
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
            try {
              await reduceItemQuantity(command.item, command.quantity);
              const quantityText = command.quantity ? `${command.quantity} ` : '';
              responseMessage = `Removed ${quantityText}${command.item} from your inventory.`;
            } catch (error) {
              responseMessage = `I couldn't find ${command.item} in your inventory.`;
            }
          } else {
            responseMessage = "I couldn't understand what item to remove. Try typing 'remove milk' or 'remove 2 apples'.";
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
      
    } catch (error) {
      console.error('Error processing text command:', error);
      await addMessage("Sorry, I had trouble processing that command. Please try again.", false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 flex flex-col h-full hover:shadow-2xl transition-all duration-300">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white px-3 py-2 rounded-t-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-1 rounded-lg">
              <MessageCircle className="w-3 h-3" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Chat with Groki</h3>
              <p className="text-primary-100 text-xs">AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Brain className="w-3 h-3 text-primary-200 animate-pulse" />
            <div className="w-1.5 h-1.5 bg-success-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Enhanced Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={clsx('flex animate-slide-up', {
              'justify-end': message.isUser,
              'justify-start': !message.isUser,
            })}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={clsx('max-w-xs lg:max-w-md group', {
              'ml-auto': message.isUser,
              'mr-auto': !message.isUser,
            })}>
              <div
                className={clsx('px-4 py-3 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg', {
                  'bg-gradient-to-r from-primary-500 to-accent-500 text-white': message.isUser,
                  'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800': !message.isUser,
                })}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-0.5">
                    {message.isUser ? (
                      <div className={clsx('flex items-center space-x-1 p-1 rounded-lg', {
                        'bg-white/20': message.isUser,
                        'bg-primary-100': !message.isUser,
                      })}>
                        {message.isVoice && (
                          <Volume2 className={clsx('w-3 h-3', {
                            'text-primary-100': message.isUser,
                            'text-primary-600': !message.isUser,
                          })} />
                        )}
                        <User className={clsx('w-3 h-3', {
                          'text-primary-100': message.isUser,
                          'text-primary-600': !message.isUser,
                        })} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                        G
                      </div>
                    )}
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p
                        className={clsx('text-xs', {
                          'text-primary-200': message.isUser,
                          'text-gray-500': !message.isUser,
                        })}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {message.isVoice && (
                        <div className={clsx('flex items-center space-x-1 text-xs', {
                          'text-primary-200': message.isUser,
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
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Footer */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gradient-to-r from-gray-50 to-white rounded-b-3xl space-y-2">
        {/* Always Listening Toggle */}
        <div className="flex justify-center">
          <AlwaysListeningToggle 
            alwaysListening={alwaysListening}
            onToggle={() => {
              const newState = !alwaysListening;
              console.log('Toggling always listening from', alwaysListening, 'to', newState);
              setAlwaysListening(newState);
            }}
            isListening={alwaysListening}
          />
        </div>
        
        {/* Chat Input Row */}
        <form onSubmit={handleTextSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message or use voice..."
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isProcessing}
            className={clsx(
              'p-2 rounded-full transition-all duration-200 flex items-center justify-center',
              {
                'bg-primary-500 text-white hover:bg-primary-600 hover:scale-105': inputMessage.trim() && !isProcessing,
                'bg-gray-300 text-gray-500 cursor-not-allowed': !inputMessage.trim() || isProcessing,
              }
            )}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
          <div className="flex items-center">
            <MiniVoiceButton 
              alwaysListening={alwaysListening}
              onAlwaysListeningChange={setAlwaysListening}
            />
          </div>
        </form>
      </div>
    </div>
  );
}