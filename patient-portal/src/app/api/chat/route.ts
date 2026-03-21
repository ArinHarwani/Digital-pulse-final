import { NextResponse } from 'next/server';
import { processChat } from '../../../../shared-apis/chatService';

export async function POST(req: Request) {
    try {
        const { message, language, records, medicines = [] } = await req.json();

        const replyText = await processChat(message, language, records, medicines);

        return NextResponse.json({ reply: replyText });

    } catch (error: any) {
        if (error.message === "Missing required chat parameters") {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Error connecting to AI Explainer" }, { status: 500 });
    }
}
