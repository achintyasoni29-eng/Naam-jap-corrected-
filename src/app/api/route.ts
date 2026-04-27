import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    const base64Data = image.split(',')[1] || image;
    const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key missing in Vercel.' }, { status: 500 });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "You are an expert OCR tool. Look closely at the digital LCD screen on this tally counter. What is the exact number displayed? Respond ONLY with the digits (e.g. 18104). Do not include any other words, letters, punctuation, or explanations." },
              { inline_data: { mime_type: mimeType, data: base64Data } }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    
    // Catch Google-specific API errors (like wrong keys or blocked requests)
    if (!response.ok) {
        return NextResponse.json({ success: false, error: `Google API Error: ${data.error?.message || 'Request blocked.'}` });
    }

    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const numbersOnly = extractedText.replace(/[^0-9]/g, '');

    if (numbersOnly) {
      return NextResponse.json({ success: true, number: parseInt(numbersOnly, 10) });
    } else {
      // If AI hallucinates, show us what it actually saw
      return NextResponse.json({ success: false, error: `AI couldn't find numbers. It saw: "${extractedText}"` });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Network error or image file size too large.' }, { status: 500 });
  }
}
