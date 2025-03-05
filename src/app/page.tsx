'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DownloadIcon, ScanEyeIcon } from 'lucide-react';
import { SiOpenai, SiOllama } from '@icons-pack/react-simple-icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import APIKeyManager from '@/components/api-key-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import OpenAIForm from '@/components/openai-form';
import OllamaForm from '@/components/ollama-form';

export default function Home() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<{ filename: string; content: string }[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'openai' | 'ollama'>('openai');

  const handleCaptions = async (newCaptions: { filename: string; content: string }[]) => {
    await handleDownload(newCaptions);
  };

  const handleCaptionProgress = (caption: { filename: string; content: string }) => {
    setCaptions((prev) => [...prev, caption]);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
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

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'openai' | 'ollama');
    setCaptions([]);
    setDownloadUrl(null);
    setError(null);
  };

  return (
    <div className='bg-background min-h-screen'>
      <Link
        href='https://github.com/aleksa-codes/gpt-flux-img-captioner'
        target='_blank'
        rel='noopener noreferrer'
        className='github-corner'
        aria-label='View source on GitHub'
      >
        <svg
          width='80'
          height='80'
          viewBox='0 0 250 250'
          className='fill-foreground text-background absolute top-0 left-0 scale-x-[-1]'
          aria-hidden='true'
        >
          <path d='M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z'></path>
          <path
            d='M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2'
            fill='currentColor'
            className='octo-arm origin-[130px_106px]'
          ></path>
          <path
            d='M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z'
            fill='currentColor'
            className='octo-body'
          ></path>
        </svg>
      </Link>
      <main className='container py-8'>
        <div className='mb-8 flex w-full flex-row justify-end gap-4'>
          {activeTab === 'openai' && <APIKeyManager onApiKeyChange={setApiKey} />}
          <ThemeToggle />
        </div>
        <div className='mb-8 space-y-2 text-center'>
          <div className='flex items-center justify-center space-x-3'>
            <ScanEyeIcon className='h-10 w-10 text-blue-500' />
            <h1 className='text-2xl font-bold tracking-tight sm:text-4xl'>GPT Image Captioner</h1>
          </div>
          <p className='text-muted-foreground text-lg'>Generate AI-powered captions for your images</p>
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

        {/* Service selection tabs */}
        <Tabs defaultValue='openai' className='mb-6' onValueChange={handleTabChange}>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='openai' className='flex items-center gap-2'>
              <SiOpenai className='h-4 w-4' /> OpenAI
            </TabsTrigger>
            <TabsTrigger value='ollama' className='flex items-center gap-2'>
              <SiOllama className='h-4 w-4' /> Ollama
            </TabsTrigger>
          </TabsList>

          <TabsContent value='openai'>
            <OpenAIForm
              apiKey={apiKey}
              onSubmit={handleCaptions}
              onProgress={handleCaptionProgress}
              onError={handleError}
            />
          </TabsContent>

          <TabsContent value='ollama'>
            <OllamaForm onSubmit={handleCaptions} onProgress={handleCaptionProgress} onError={handleError} />
          </TabsContent>
        </Tabs>

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
                Generated Captions {captions.length > 0 && `(${captions.length})`}
              </CardTitle>
              <Button size='lg' disabled={!downloadUrl} className='disabled:cursor-not-allowed disabled:opacity-50'>
                <a href={downloadUrl || ''} download='captions.zip' className='flex gap-2'>
                  <DownloadIcon className='h-5 w-5' />
                  Download {downloadUrl ? 'ZIP' : '(Processing...)'}
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-64 rounded-md border p-4'>
                <ul className='space-y-3'>
                  {captions.map((caption, index) => (
                    <li key={index} className='flex flex-col gap-1'>
                      <span className='text-primary text-sm font-medium'>{caption.filename}</span>
                      <span className='text-muted-foreground text-sm'>{caption.content}</span>
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
