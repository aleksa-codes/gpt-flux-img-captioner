import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  const { captions } = await req.json();
  const zip = new JSZip();

  captions.forEach((caption: { filename: string; content: string }) => {
    zip.file(caption.filename, caption.content);
  });

  try {
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=captions_${Date.now()}.zip`,
      },
    });
  } catch (error) {
    console.error('Error creating zip file:', error);
    return new NextResponse('Error creating zip file', { status: 500 });
  }
}
