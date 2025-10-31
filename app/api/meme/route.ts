import { NextResponse } from 'next/server';
import { createMeme, getMemePresets } from '@/src/lib/meme-pipeline';
import { ContentType, MemeAttributes } from '@/src/schemas/meme';
import memesData from '@/src/api/dummy/memes.json';

/**
 * GET /api/meme
 * Get meme presets or list
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  // Return list of meme presets
  if (action === 'presets') {
    return NextResponse.json({
      presets: getMemePresets()
    });
  }

  // Get specific meme by ID
  if (id) {
    const meme = memesData.memes.find(m => m.id === id);
    if (meme) {
      return NextResponse.json({ meme });
    }
    return NextResponse.json({ error: 'Meme not found' }, { status: 404 });
  }

  // Return all memes
  return NextResponse.json({ memes: memesData.memes });
}

/**
 * POST /api/meme
 * Create a new meme with custom attributes
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contentType, title, attributes } = body;

    if (!contentType || !title) {
      return NextResponse.json(
        { error: 'contentType and title are required' },
        { status: 400 }
      );
    }

    const meme = createMeme(
      contentType as ContentType,
      title,
      attributes as Partial<MemeAttributes>
    );

    return NextResponse.json({ meme });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create meme' },
      { status: 500 }
    );
  }
}

