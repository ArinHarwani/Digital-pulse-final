import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface PatientAIChatProps {
  patient: any;
  records: any[];
  medicines: any[];
  profile: any;
}

const PRIMARY_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const SECONDARY_KEY = import.meta.env.VITE_GEMINI_API_KEY_SECONDARY || "";

export function PatientAIChat({ patient, records, medicines, profile }: PatientAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: `Hello Doctor. I have reviewed the medical records for ${patient.name}. How can I assist you with this patient?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initial Context
  const systemContext = `
    You are an expert ER critical care AI assistant evaluating a patient in an emergency.
    Answer the doctor's questions concisely and accurately based ONLY on the following medical data.
    If the data does not contain the answer, say "I don't have that information in the current records."
    
    PATIENT INFO:
    Name: ${patient.name}
    Blood Group: ${patient.blood_type || profile.blood_group || 'Unknown'}
    Age/Height/Weight: ${patient.age || profile.age || 'Unknown'}, ${profile.height || 'Unknown'}, ${profile.weight || 'Unknown'}
    Allergies: ${profile.allergies || (patient.medical_conditions && Array.isArray(patient.medical_conditions) ? patient.medical_conditions.join(', ') : 'None recorded')}
    Important Info: ${profile.important_medical_info || (patient.medical_conditions && Array.isArray(patient.medical_conditions) ? 'Known chronic conditions exist' : 'None')}

    MEDICINES ACTIVELY TAKEN:
    ${medicines.length > 0 ? medicines.map((m: any) => `- ${m.name} (${m.dosage})`).join('\n') : 'None recorded'}

    LAB/MEDICAL REPORTS AVAILABLE:
    ${records.length > 0 ? records.map((r: any) => `- [${r.type}] ${r.title}: ${r.summary}`).join('\n') : 'No records uploaded'}
  `;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Build history payload for Gemini
      const historyPayload = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      // Append new message
      historyPayload.push({
        role: 'user',
        parts: [{ text: userMsg }]
      });

      const callGemini = async (key: string) => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemContext }]
            },
            contents: historyPayload
          })
        });
        if (!res.ok) throw new Error("Gemini API Error");
        return await res.json();
      };

      try {
        const result = await callGemini(PRIMARY_KEY);
        const reply = result.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'model', content: reply }]);
      } catch (primaryErr) {
        toast({ title: "API Failover", description: "Primary Key failed. Switching to Secondary Key.", variant: "warning" as any });
        const result = await callGemini(SECONDARY_KEY);
        const reply = result.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'model', content: reply }]);
      }
    } catch (e) {
      console.error("Chat Error:", e);
      setMessages(prev => [...prev, { role: 'model', content: "⚠️ Sorry, I encountered an error analyzing the records. Please consult the raw data." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <Card className="border-border shadow-md mt-6 animate-in slide-in-from-bottom duration-500 overflow-hidden flex flex-col h-[500px]">
      <CardHeader className="bg-primary/5 py-4 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-primary" />
          Digital Pulse Interactive Clinical Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div 
                  className={`max-w-[80%] rounded-2xl p-3 px-4 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-muted text-foreground rounded-tl-sm prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-p:last:mb-0'
                  }`}
                >
                  {msg.role === 'model' ? (
                       <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Analyzing patient records...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 bg-background border-t">
          <div className="flex gap-2">
            <Input 
              placeholder="Ask about allergies, recent meds, conditions..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
