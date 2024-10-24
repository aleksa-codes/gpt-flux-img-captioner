'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2Icon, DownloadIcon, ScanEyeIcon, ImageIcon, FileTextIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import APIKeyManager from '@/components/api-key-manager';

const formSchema = z.object({
  images: z.array(z.instanceof(File)).nonempty('At least one image is required.'),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<{ filename: string; content: string }[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prefix: '',
      suffix: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (data.images.length === 0) {
      console.error('At least one image is required.');
      return;
    }

    setDownloadUrl(null);
    setCaptions([]);
    setLoading(true);
    setError(null); // Clear any previous error

    const formData = new FormData();
    for (let i = 0; i < data.images.length; i++) {
      formData.append('images', data.images[i]);
    }
    formData.append('prefix', data.prefix || '');
    formData.append('suffix', data.suffix || '');

    if (apiKey) {
      formData.append('apiKey', apiKey);
    }

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error with the API request');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let completeData = '';

      const tempCaptions: { filename: string; content: string }[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          completeData += decoder.decode(value, { stream: true });

          const lines = completeData.split('\n\n');
          completeData = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const { filename, caption } = JSON.parse(line.substring(6));
              if (caption.startsWith('Error:')) {
                setError(caption.substring(7));
                setLoading(false);
                return;
              } else {
                tempCaptions.push({ filename, content: caption });
                setCaptions((prevCaptions) => [...prevCaptions, { filename, content: caption }]);
              }
            }
          }
        }
      }

      await handleDownload(tempCaptions);
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error('Submission error:', err);
    }

    setLoading(false);
  };

  const handleDownload = async (captions: { filename: string; content: string }[]) => {
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ captions }),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } else {
      setError('Error downloading the file.');
      console.error('Error downloading zip file');
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='flex w-full flex-row justify-end p-4 pb-0'>
        <ThemeToggle />
      </div>
      <main className='container mx-auto max-w-3xl px-4 py-8'>
        <APIKeyManager onApiKeyChange={setApiKey} />

        <div className='mb-8 space-y-2 text-center'>
          <div className='flex items-center justify-center space-x-3'>
            <ScanEyeIcon className='h-10 w-10 text-blue-500' />
            <h1 className='text-2xl font-bold tracking-tight sm:text-4xl'>GPT Image Captioner</h1>
          </div>
          <p className='text-lg text-muted-foreground'>Generate AI-powered captions for your images</p>
        </div>
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='text-xl'>About this Tool</CardTitle>
            <CardDescription>
              This tool serves as a replacement for auto captioning via LLaVA, providing you with a zip file containing
              all generated captions. Perfect for dataset preparation when training custom models.
            </CardDescription>
            <CardDescription>
              Compatible with Flux tools like{' '}
              <a
                href='https://fal.ai/models/fal-ai/flux-lora-fast-training'
                className='text-primary hover:underline'
                target='_blank'
              >
                fal LoRA Trainer
              </a>{' '}
              and{' '}
              <a
                href='https://replicate.com/ostris/flux-dev-lora-trainer/train'
                className='text-primary hover:underline'
                target='_blank'
              >
                Replicate LoRA Trainer
              </a>
              . The generated captions can be used directly in your training pipeline.
            </CardDescription>
          </CardHeader>
        </Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <Card>
              <CardContent className='pt-6'>
                <FormField
                  control={form.control}
                  name='images'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <ImageIcon className='h-4 w-4' />
                        Select Images
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='file'
                          accept='image/*'
                          className='h-14 file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:cursor-pointer hover:file:cursor-pointer hover:file:bg-primary/90'
                          multiple
                          onChange={(e) => {
                            const files = e.target.files ? Array.from(e.target.files) : [];
                            field.onChange(files);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='mt-4 flex flex-col gap-4 sm:flex-row'>
                  <FormField
                    control={form.control}
                    name='prefix'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>Caption Prefix</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='Optional prefix...' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='suffix'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>Caption Suffix</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='Optional suffix...' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            <Button type='submit' className='w-full' size='lg' disabled={loading}>
              {loading ? (
                <>
                  <Loader2Icon className='mr-2 h-5 w-5 animate-spin' />
                  Processing Images...
                </>
              ) : (
                <>
                  <FileTextIcon className='mr-2 h-5 w-5' />
                  Generate Captions
                </>
              )}
            </Button>
          </form>
        </Form>
        {error && (
          <Alert variant='destructive' className='mt-6'>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {captions.length > 0 && (
          <Card className='mt-6'>
            <CardHeader className='flex flex-row justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <FileTextIcon className='h-5 w-5' />
                Generated Captions
              </CardTitle>
              <Button size='lg' disabled={!downloadUrl} className='disabled:cursor-not-allowed disabled:opacity-50'>
                <a href={downloadUrl || ''} download='captions.zip' className='flex gap-2'>
                  <DownloadIcon className='h-5 w-5' />
                  Download (ZIP)
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-64 rounded-md border p-4'>
                <ul className='space-y-3'>
                  {captions.map((caption, index) => (
                    <li key={index} className='flex flex-col gap-1'>
                      <span className='text-sm font-medium text-primary'>{caption.filename}</span>
                      <span className='text-sm text-muted-foreground'>{caption.content}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
