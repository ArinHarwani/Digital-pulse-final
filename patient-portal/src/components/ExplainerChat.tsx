'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ExplainerChatProps {
    patientRecordsContext: any;
    medicinesContext?: any[];
}

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'hi', label: 'हिंदी' },
];

export default function ExplainerChat({ patientRecordsContext, medicinesContext = [] }: ExplainerChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [language, setLanguage] = useState('en');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    language: LANGUAGES.find((l) => l.code === language)?.label || 'English',
                    records: patientRecordsContext,
                    medicines: medicinesContext,
                }),
            });

            if (!res.ok) throw new Error('Failed to fetch AI response');
            const data = await res.json();

            setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to the explainer network." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Header & Language Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h3 className="font-bold" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--color-primary)' }}>✦</span> Digital Pulse AI Assistant
                    </h3>
                    <p className="text-muted" style={{ fontSize: '13px' }}>Instant clinical insights from your medical records</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
                    <label htmlFor="lang-select" style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6, textTransform: 'uppercase' }}>Language</label>
                    <select
                        id="lang-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{ border: 'none', fontSize: '13px', background: 'transparent', color: 'white', outline: 'none', cursor: 'pointer', fontWeight: '600' }}
                    >
                        {LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code} style={{ background: '#0f172a' }}>{lang.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Chat Window */}
            <div className="clinical-card" style={{ height: '600px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.4)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Welcome Message */}
                    <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', padding: '14px 18px', borderRadius: '18px 18px 18px 0', maxWidth: '85%' }}>
                        <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--color-text-main)' }}>
                            Hello! I've analyzed your medical profile. You have <strong>{patientRecordsContext.length}</strong> medical records and <strong>{medicinesContext.length}</strong> medication(s) loaded. 
                            How can I help you understand your health today?
                        </p>
                    </div>

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.role === 'user' ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'rgba(255,255,255,0.05)',
                                color: 'white',
                                padding: '14px 18px',
                                border: msg.role === 'user' ? 'none' : '1px solid var(--color-border)',
                                borderRadius: msg.role === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                                maxWidth: '85%',
                                boxShadow: msg.role === 'user' ? '0 4px 15px rgba(37, 99, 235, 0.3)' : 'none'
                            }}
                        >
                            <p style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                        </div>
                    ))}
                    {isLoading && (
                        <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderRadius: '18px 18px 18px 0', border: '1px solid var(--color-border)' }}>
                            <p style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600' }}>
                                <span className="animate-pulse">Thinking...</span>
                            </p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', padding: '20px', background: 'rgba(30, 41, 59, 0.8)', borderTop: '1px solid var(--color-border)', backdropFilter: 'blur(10px)' }}>
                    <input
                        type="text"
                        placeholder="Ask a health question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        style={{ 
                            flex: 1, padding: '12px 20px', borderRadius: 'var(--radius-full)', 
                            border: '1px solid var(--color-border)', outline: 'none', fontSize: '14px',
                            background: 'rgba(15, 23, 42, 0.5)', color: 'white'
                        }}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: 'auto', padding: '0 24px', opacity: isLoading || !input.trim() ? 0.6 : 1, borderRadius: 'var(--radius-full)' }}
                        disabled={isLoading || !input.trim()}
                    >
                        Send
                    </button>
                </form>
            </div>

            {/* Required Disclaimer */}
            <div style={{ marginTop: '16px', textAlign: 'center', padding: '0 20px' }}>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                    <strong>Note:</strong> I am an AI providing clinical summaries, not a licensed physician. Always verify medical decisions with your real-world healthcare provider.
                </p>
            </div>

        </div>
    );
}
