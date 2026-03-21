import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Camera,
  Mic,
  Send,
  Image as ImageIcon,
  Loader2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useToast } from '@/hooks/use-toast';
import { FirstAidMessage } from '@/types';
import { sendChatMessage, formatMessagesForApi } from '@/services/deepseek';
import { speakText, stopSpeaking, isTTSSupported } from '@/services/speech';

const initialMessages: FirstAidMessage[] = [
  {
    id: '1',
    type: 'system',
    content: "🚨 AI First-Aid Assistant activated. I'm here to guide you through the emergency.",
    timestamp: new Date(),
  },
  {
    id: '2',
    type: 'ai',
    content: "I need to assess the situation. Can you tell me what happened? Is the patient conscious and breathing?",
    timestamp: new Date(),
    options: ["Patient is conscious", "Patient is unconscious", "There's bleeding", "Accident/Injury"]
  },
];

const FirstAidScreen = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<FirstAidMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: FirstAidMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Format previous messages for API
      const previousMessages = formatMessagesForApi(messages);

      // Call DeepSeek API
      const response = await sendChatMessage(previousMessages, text);

      const aiMessage: FirstAidMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        options: response.options,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Speak response if voice mode is on
      if (isVoiceMode) {
        speakText(response.content);
      }
    } catch (error) {
      console.error('AI response error:', error);

      // Fallback response on error
      const fallbackMessage: FirstAidMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm having trouble connecting right now. Stay calm and continue to monitor the patient. If this is a life-threatening emergency, call emergency services immediately.",
        timestamp: new Date(),
        options: ["Try again", "Call Emergency Services", "Need immediate help"],
      };

      setMessages(prev => [...prev, fallbackMessage]);

      toast({
        title: "Connection Issue",
        description: "Unable to reach AI assistant. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleOptionClick = (option: string) => {
    handleSend(option);
  };

  const handleImageUpload = () => {
    toast({
      title: "Upload Photo",
      description: "This would open camera/gallery to upload injury photo",
    });
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({
        title: "🎤 Recording...",
        description: "Speak clearly about the emergency",
      });
      // Simulate recording stop after 3 seconds
      setTimeout(() => {
        setIsRecording(false);
        handleSend("Patient appears to be in pain and has difficulty breathing");
      }, 3000);
    }
  };

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      stopSpeaking();
    }
    setIsVoiceMode(!isVoiceMode);
    toast({
      title: isVoiceMode ? "Voice Mode Off" : "Voice Mode On",
      description: isVoiceMode ? "AI will no longer speak responses" : "AI will speak responses aloud",
    });
  };

  return (
    <MobileLayout
      showHeader
      headerContent={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">First-Aid Assistant</h1>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-medical animate-pulse" />
                <span className="text-medical font-medium">AI Active</span>
              </div>
            </div>
          </div>
          {isTTSSupported() && (
            <button
              onClick={toggleVoiceMode}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isVoiceMode
                  ? 'bg-safe text-white shadow-lg shadow-safe/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              title={isVoiceMode ? "Turn off voice" : "Turn on voice"}
            >
              {isVoiceMode ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          )}
        </div>
      }
    >
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.type === 'user'
                  ? 'bg-emergency text-primary-foreground rounded-br-md'
                  : message.type === 'system'
                    ? 'bg-warning-light text-foreground border border-warning/30'
                    : 'bg-card text-foreground border border-border rounded-bl-md'
                }`}
            >
              {message.type === 'ai' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-safe flex items-center justify-center">
                    <span className="text-xs">🤖</span>
                  </div>
                  <span className="text-xs font-medium text-safe">AI Assistant</span>
                  {isVoiceMode && (
                    <button
                      onClick={() => speakText(message.content)}
                      className="ml-auto p-1 hover:bg-safe/10 rounded-full transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3 h-3 text-safe" />
                    </button>
                  )}
                </div>
              )}

              <p className="text-sm leading-relaxed">{message.content}</p>

              {message.options && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleOptionClick(option)}
                      className="px-3 py-1.5 bg-safe/10 hover:bg-safe/20 text-safe text-xs font-medium rounded-full transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-safe" />
                <span className="text-sm text-muted-foreground">AI is analyzing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-card/95 backdrop-blur-md border-t border-border p-4 space-y-3">
        {/* Media Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleImageUpload}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            <Camera className="w-4 h-4" />
            Photo
          </button>
          <button
            onClick={() => {
              toast({
                title: "Video Upload",
                description: "This would allow video upload of the scene",
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            Video
          </button>
        </div>

        {/* Text Input */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleVoiceRecord}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isRecording
                ? 'bg-emergency text-primary-foreground animate-pulse'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            <Mic className="w-5 h-5" />
          </button>

          <Input
            placeholder="Describe the situation..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
            className="flex-1 h-12 rounded-xl bg-muted border-0"
          />

          <Button
            variant="emergency"
            size="icon"
            className="w-12 h-12 rounded-xl"
            onClick={() => handleSend(inputText)}
            disabled={!inputText.trim() || isTyping}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default FirstAidScreen;
