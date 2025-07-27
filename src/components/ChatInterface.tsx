import { useEffect, useRef } from 'react';
import { MessageCircle, Mic, User, Volume2, Brain } from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';
import { clsx } from 'clsx';

export function ChatInterface() {
  const { messages } = useInventoryStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 flex flex-col h-96 hover:shadow-2xl transition-all duration-300">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white px-6 py-5 rounded-t-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Chat with Groki</h3>
              <p className="text-primary-100 text-xs">AI-Powered Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Brain className="w-4 h-4 text-primary-200 animate-pulse" />
            <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Enhanced Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
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

      {/* Enhanced Footer */}
      <div className="border-t border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white rounded-b-3xl">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <Volume2 className="w-4 h-4 text-primary-500" />
          <p className="text-xs font-medium">
            Use the voice button to start chatting!
          </p>
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}