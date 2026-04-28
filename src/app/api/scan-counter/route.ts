import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    const apiKey = process.env.OCR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'OCR API key missing in Vercel.' }, { status: 500 });
    }

    // Ensure the image has the correct base64 prefix for the OCR engine
    const base64Image = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

    // Package the data exactly how OCR.space likes it
    const formData = new URLSearchParams();
    formData.append('base64Image', base64Image);
    formData.append('apikey', apiKey);
    formData.append('OCREngine', '2'); // Engine 2 is optimized for numbers and LCD screens
    formData.append('scale', 'true');  // Helps read blurry images

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const data = await response.json();
    
    // Catch API errors
    if (data.IsErroredOnProcessing) {
        return NextResponse.json({ success: false, error: `OCR Error: ${data.ErrorMessage?.[0] || 'Unknown error'}` });
    }

    // Extract the text and strip out any random artifacts
    const extractedText = data.ParsedResults?.[0]?.ParsedText || '';
    const numbersOnly = extractedText.replace(/[^0-9]/g, '');

    if (numbersOnly) {
      return NextResponse.json({ success: true, number: parseInt(numbersOnly, 10) });
    } else {
      return NextResponse.json({ success: false, error: `Could not find clear numbers. Saw: "${extractedText}"` });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Network error communicating with OCR.' }, { status: 500 });
  }
}
