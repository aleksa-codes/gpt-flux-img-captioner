'use client';

import { useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import { SiOpenai, SiOllama } from '@icons-pack/react-simple-icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import OpenAIForm from '@/components/openai-form';
import OllamaForm from '@/components/ollama-form';

interface ImageCaptionerClientProps {
  initialApiKey: string | null;
}

export default function ImageCaptionerClient({ initialApiKey }: ImageCaptionerClientProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<{ filename: string; content: string }[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(initialApiKey);
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
    <>
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
            initialApiKey={apiKey}
            onApiKeyChange={setApiKey}
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
    </>
  );
}
