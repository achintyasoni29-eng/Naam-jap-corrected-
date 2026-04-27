import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    // Clean up the base64 string
    const base64Data = image.split(',')[1] || image;
    const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'AI is sleeping (API key missing)' }, { status: 500 });
    }

    // Call the Gemini Vision API
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
    
    // Extract the AI's guess and strip out any accidental text
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const numbersOnly = extractedText.replace(/[^0-9]/g, '');

    if (numbersOnly) {
      return NextResponse.json({ success: true, number: parseInt(numbersOnly, 10) });
    } else {
      return NextResponse.json({ success: false, error: 'Could not read the LCD screen clearly.' });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Network error communicating with AI.' }, { status: 500 });
  }
}
