// Groq AI Chat Service
// Uses Vite proxy to call Groq API (bypasses CORS in development)

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GroqResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

// Use proxy in development
const GROQ_API_URL = '/api/groq/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are an AI First-Aid Emergency Assistant for RoadResQ, a roadside emergency app. 
Your role is to provide clear, calm, and actionable first-aid guidance during emergencies.

Guidelines:
- Keep responses concise and easy to follow (2-4 sentences max)
- Use simple, non-medical language that anyone can understand
- Prioritize life-saving actions (ABC: Airway, Breathing, Circulation)
- Always remind users that professional help is on the way if applicable
- Ask follow-up questions to assess the situation better
- Provide step-by-step instructions when needed
- Be reassuring and calm to help reduce panic

At the end of each response, provide 2-3 quick action options the user can tap.
Format options on a new line starting with "Options: " followed by comma-separated choices.
Example: "Options: Show CPR steps, Patient is breathing, Need voice guidance"`;

export async function sendChatMessage(
    messages: Array<{ type: string; content: string }>,
    userMessage: string
): Promise<{ content: string; options: string[] }> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        throw new Error('Groq API key not configured');
    }

    // Build messages array
    const allMessages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add previous conversation
    for (const msg of messages) {
        if (msg.type === 'user') {
            allMessages.push({ role: 'user', content: msg.content });
        } else if (msg.type === 'ai') {
            allMessages.push({ role: 'assistant', content: msg.content });
        }
    }

    // Add current user message
    allMessages.push({ role: 'user', content: userMessage });

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: allMessages,
                temperature: 0.7,
                max_tokens: 300,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Groq API error:', errorData);
            throw new Error('Failed to get AI response');
        }

        const data: GroqResponse = await response.json();
        console.log('Groq response:', data);

        const fullContent = data.choices[0]?.message?.content ||
            'I apologize, I could not process that. Please try again.';

        // Parse options from response
        const { content, options } = parseResponse(fullContent);

        return { content, options };
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

function parseResponse(fullContent: string): { content: string; options: string[] } {
    const optionsMatch = fullContent.match(/Options:\s*(.+)$/im);

    if (optionsMatch) {
        const content = fullContent.replace(/Options:\s*.+$/im, '').trim();
        const options = optionsMatch[1]
            .split(',')
            .map(opt => opt.trim())
            .filter(opt => opt.length > 0);
        return { content, options };
    }

    // Default options if none provided
    return {
        content: fullContent,
        options: ['Tell me more', 'What should I do next?', 'Need immediate help'],
    };
}

// Convert messages for API format (legacy compatibility)
export function formatMessagesForApi(messages: Array<{ type: string; content: string }>): Array<{ type: string; content: string }> {
    return messages.filter(m => m.type === 'user' || m.type === 'ai');
}
