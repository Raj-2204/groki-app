import { useState, useCallback, useRef, useEffect } from 'react';
import type { VoiceRecognitionOptions } from '../types';

// Extend Window interface for browser compatibility
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;
  confidence: number;
  isSupported: boolean;
  isWaitingForWakeWord: boolean;
  isActivelyListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceRecognition(options: VoiceRecognitionOptions = {}): UseVoiceRecognitionReturn {
  const {
    onResult,
    onError,
    onStart,
    onEnd,
    onWakeWordDetected,
    language = 'en-US',
    continuous = false,
    wakeWords = ['hey groki', 'groki'],
    alwaysListening = false,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [isWaitingForWakeWord, setIsWaitingForWakeWord] = useState(false);
  const [isActivelyListening, setIsActivelyListening] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const wakeWordDetectedRef = useRef(false);
  const isListeningForCommandRef = useRef(false);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef({
    onResult,
    onError,
    onStart,
    onEnd,
    onWakeWordDetected,
  });

  // Update callbacks ref when props change
  useEffect(() => {
    callbacksRef.current = {
      onResult,
      onError,
      onStart,
      onEnd,
      onWakeWordDetected,
    };
  }, [onResult, onError, onStart, onEnd, onWakeWordDetected]);

  useEffect(() => {
    console.log('useVoiceRecognition useEffect triggered, alwaysListening:', alwaysListening);
    
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = alwaysListening || continuous;
      recognition.interimResults = true;
      recognition.lang = language;
      
      console.log('Recognition configured with continuous:', recognition.continuous);

      recognition.onstart = () => {
        console.log('Speech recognition started, alwaysListening:', alwaysListening);
        setIsListening(true);
        if (alwaysListening) {
          setIsWaitingForWakeWord(true);
          setIsActivelyListening(false);
        }
        callbacksRef.current.onStart?.();
      };

      recognition.onend = () => {
        console.log('Speech recognition ended, alwaysListening:', alwaysListening);
        setIsListening(false);
        setIsWaitingForWakeWord(false);
        setIsActivelyListening(false);
        
        // Auto-restart if always listening is enabled
        if (alwaysListening && isSupported) {
          console.log('Attempting to restart recognition...');
          setTimeout(() => {
            try {
              recognition.start();
              console.log('Recognition restarted successfully');
            } catch (error) {
              console.log('Recognition restart failed:', error);
            }
          }, 100);
        }
        
        callbacksRef.current.onEnd?.();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsWaitingForWakeWord(false);
        setIsActivelyListening(false);
        
        // Don't restart on certain errors
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          callbacksRef.current.onError?.(`Microphone permission denied. Please allow microphone access.`);
          return;
        }
        
        callbacksRef.current.onError?.(event.error);
        
        // Auto-restart if always listening is enabled and it's not a permission error
        if (alwaysListening && event.error !== 'aborted') {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.log('Recognition restart after error failed:', error);
            }
          }, 1000);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
            maxConfidence = Math.max(maxConfidence, result[0].confidence || 0);
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        setConfidence(maxConfidence);

        // Check for wake words if we're in always listening mode
        if (alwaysListening) {
          const lowerTranscript = currentTranscript.toLowerCase();
          
          // Only log if there's actual content
          if (currentTranscript.trim()) {
            console.log('Current transcript:', lowerTranscript);
            console.log('Wake word detected ref:', wakeWordDetectedRef.current);
          }
          
          // More flexible wake word detection with phonetic variations
          const wakeWordDetected = wakeWords.some(wakeWord => {
            const lowerWakeWord = wakeWord.toLowerCase();
            const detected = lowerTranscript.includes(lowerWakeWord);
            if (detected && currentTranscript.trim()) {
              console.log(`Wake word "${wakeWord}" detected in transcript: "${currentTranscript}"`);
            }
            return detected;
          });

          // Detect wake word from either final or interim results
          if (wakeWordDetected && !wakeWordDetectedRef.current) {
            console.log('Activating wake word detection!');
            wakeWordDetectedRef.current = true;
            isListeningForCommandRef.current = true;
            setIsWaitingForWakeWord(false);
            setIsActivelyListening(true);
            callbacksRef.current.onWakeWordDetected?.();
            
            // Start 10-second timeout for command
            if (commandTimeoutRef.current) {
              clearTimeout(commandTimeoutRef.current);
            }
            
            commandTimeoutRef.current = setTimeout(() => {
              console.log('Command timeout - resetting to wake word listening');
              wakeWordDetectedRef.current = false;
              isListeningForCommandRef.current = false;
              setIsActivelyListening(false);
              setIsWaitingForWakeWord(true);
              setTranscript('');
            }, 10000); // 10 seconds
            
            // Don't return here - let it continue to process any command in the same breath
            // setTimeout(() => setTranscript(''), 300);
            // return;
          }

          // If wake word was detected and we have a final result, process the command
          if (wakeWordDetectedRef.current && finalTranscript.trim()) {
            console.log('Processing command after wake word:', finalTranscript);
            
            // Remove wake word from the command with word boundary matching
            let command = finalTranscript.trim();
            wakeWords.forEach(wakeWord => {
              // Use word boundaries to avoid partial matches
              const regex = new RegExp(`\\b${wakeWord.replace(/\s+/g, '\\s+')}\\b`, 'gi');
              command = command.replace(regex, '').trim();
            });

            console.log('Cleaned command:', command);

            // Process command even if it's empty (let the application handle it)
            if (command || finalTranscript.trim()) {
              // If no command after cleaning, use the full transcript
              const commandToSend = command || finalTranscript.trim();
              console.log('Sending command:', commandToSend);
              callbacksRef.current.onResult?.(commandToSend);
            }
            
            // Clear the command timeout since we got a command
            if (commandTimeoutRef.current) {
              clearTimeout(commandTimeoutRef.current);
              commandTimeoutRef.current = null;
            }
            
            // Always reset state after processing, regardless of command success
            console.log('Resetting wake word state');
            wakeWordDetectedRef.current = false;
            isListeningForCommandRef.current = false;
            setIsActivelyListening(false);
            setIsWaitingForWakeWord(true);
            setTranscript('');
          }
        } else {
          // Regular mode - process any final transcript
          if (finalTranscript.trim()) {
            callbacksRef.current.onResult?.(finalTranscript.trim());
            if (!continuous) {
              recognition.stop();
            }
          }
        }
      };
    } else {
      setIsSupported(false);
      callbacksRef.current.onError?.('Speech recognition is not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
    };
  }, [language, continuous, alwaysListening, wakeWords, isSupported]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && isSupported) {
      try {
        setTranscript('');
        setConfidence(0);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        callbacksRef.current.onError?.('Failed to start voice recognition');
      }
    }
  }, [isListening, isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
  }, []);

  return {
    isListening,
    transcript,
    confidence,
    isSupported,
    isWaitingForWakeWord,
    isActivelyListening,
    startListening,
    stopListening,
    resetTranscript,
  };
}