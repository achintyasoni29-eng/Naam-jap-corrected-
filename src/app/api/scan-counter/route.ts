import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

/**
 * POST /api/scan-counter
 *
 * Accepts a base64-encoded image of a physical tally/kunti counter
 * and uses VLM (Vision Language Model) to read the displayed number.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body as { image?: string };

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided. Send a base64-encoded image in the "image" field.' },
        { status: 400 }
      );
    }

    // Normalize the base64 string – strip data URI prefix if present
    const base64Data = image.includes('base64,')
      ? image.split('base64,')[1]
      : image;

    // Build the data URI for VLM
    const mimeType = image.includes('image/png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    const zai = await ZAI.create();

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                'You are an expert OCR system for physical tally counters (kunti counters / click counters / mechanical counters).',
                '',
                'Look at this image carefully. It shows a physical counter device with a digital or mechanical number display.',
                '',
                'Your task:',
                '1. Identify the number currently displayed on the counter.',
                '2. Return ONLY the number as a plain integer (no commas, no text, no explanation).',
                '3. If the counter shows "00000" or all zeros, return 0.',
                '4. If you cannot read any number, return -1.',
                '',
                'Important: These counters typically show 4-6 digit numbers. Read each digit carefully.',
              ].join('\n'),
            },
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const rawContent = response.choices?.[0]?.message?.content || '';
    // Extract the first integer from the response
    const match = rawContent.match(/-?\d+/);
    const detectedNumber = match ? parseInt(match[0], 10) : -1;

    if (detectedNumber < 0) {
      return NextResponse.json({
        success: false,
        number: 0,
        message: 'Could not read a number from the counter. Please retake the photo with better lighting and focus.',
        raw: rawContent,
      });
    }

    return NextResponse.json({
      success: true,
      number: detectedNumber,
      message: `Detected ${detectedNumber.toLocaleString('en-IN')} from counter.`,
    });
  } catch (error) {
    console.error('Scan counter API error:', error);
    return NextResponse.json(
      { error: 'Failed to process image. Please try again.' },
      { status: 500 }
    );
  }
}
