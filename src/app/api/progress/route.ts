import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { Buffer } from 'buffer';
import path from 'path';

export const maxDuration = 60;

const formatCaption = (caption: string, prefix: string, suffix: string): string => {
  const trimmedPrefix = prefix.trim().replace(/^,/, '').replace(/,$/, '');
  const trimmedSuffix = suffix.trim().replace(/^,/, '').replace(/,$/, '');
  let formattedCaption = caption.trim().toLowerCase();
  if (formattedCaption.endsWith('.')) {
    formattedCaption = formattedCaption.slice(0, -1);
  }

  const prefixPart = trimmedPrefix ? `${trimmedPrefix}, ` : '';
  const suffixPart = trimmedSuffix ? `, ${trimmedSuffix}` : '';
  return `${prefixPart}${formattedCaption}${suffixPart}`;
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const images = formData.getAll('images') as File[];
  const prefix = (formData.get('prefix') as string) || '';
  const suffix = (formData.get('suffix') as string) || '';
  const apiKey = (formData.get('apiKey') as string) || process.env['OPENAI_API_KEY'];

  const client = new OpenAI({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const buffer = await image.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');

        try {
          const systemMessage = `Generate a detailed comma-separated caption that will be used for AI image generation.`;

          const res = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemMessage },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: `data:${image.type};base64,${base64Image}`, detail: 'auto' },
                  },
                ],
              },
            ],
          });

          let caption = res.choices[0].message.content || '';
          const formattedCaption = formatCaption(caption, prefix, suffix);
          const txtFilename = `${path.parse(image.name).name}.txt`;
          controller.enqueue(`data: ${JSON.stringify({ filename: txtFilename, caption: formattedCaption })}\n\n`);
        } catch (error) {
          console.error('Error generating caption:', error);
          const txtFilename = `${path.parse(image.name).name}.txt`;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          controller.enqueue(
            `data: ${JSON.stringify({ filename: txtFilename, caption: `Error: ${errorMessage}` })}\n\n`,
          );
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
