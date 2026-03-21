import { NextResponse } from 'next/server';
import { extractMedicalData } from '../../../../shared-apis/extractService';

export async function POST(req: Request) {
    try {
        const { documentUrl, uniqueKey } = await req.json();

        const parsedData = await extractMedicalData(documentUrl, uniqueKey);

        return NextResponse.json({ success: true, data: parsedData });

    } catch (error: any) {
        if (error.message === "Missing required fields") {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        console.error("Extraction API Error:", error);
        return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
    }
}
