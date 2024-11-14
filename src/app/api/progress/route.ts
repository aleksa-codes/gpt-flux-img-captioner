import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { Buffer } from 'buffer';
import path from 'path';

export const maxDuration = 60;

const formatCaption = (caption: string, prefix: string, suffix: string): string => {
  // remove trailing comma from prefix
  const trimmedPrefix = prefix.trim().replace(/,$/, '');
  // remove leading comma from suffix
  const trimmedSuffix = suffix.trim().replace(/^,/, '');

  // lowercase the first letter
  caption = caption.charAt(0).toLowerCase() + caption.slice(1);
  // remove trailing period
  caption = caption.replace(/\.$/, '');

  // format prefix and suffix
  const prefixPart = trimmedPrefix ? `${trimmedPrefix}, ` : '';
  const suffixPart = trimmedSuffix ? `, ${trimmedSuffix}` : '';

  // remove newlines and multiple spaces
  return `${prefixPart}${caption}${suffixPart}`.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const images = formData.getAll('images') as File[];
  const prefix = (formData.get('prefix') as string) || '';
  const suffix = (formData.get('suffix') as string) || '';
  const systemMessage =
    (formData.get('systemMessage') as string) ||
    'Generate a concise, yet detailed comma-separated caption. Do not use markdown. Do not have an intro or outro.';
  const userPrompt =
    (formData.get('userPrompt') as string) ||
    'Describe this image, focusing on the main elements, style, and composition.';
  const model = (formData.get('model') as string) || 'gpt-4o-mini';
  const detail = (formData.get('detail') as string) || 'auto';
  const apiKey = (formData.get('apiKey') as string) || process.env['OPENAI_API_KEY'];

  const client = new OpenAI({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const buffer = await image.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');

        try {
          const res = await client.chat.completions.create({
            model: model,
            messages: [
              { role: 'system', content: systemMessage },
              {
                role: 'user',
                content: [
                  { type: 'text', text: userPrompt },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${image.type};base64,${base64Image}`,
                      detail: detail as 'auto' | 'low' | 'high',
                    },
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
