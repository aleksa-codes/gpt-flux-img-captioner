'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2Icon, DownloadIcon, ScanEyeIcon, ImageIcon, FileTextIcon, KeyIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import APIKeyManager from '@/components/api-key-manager';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDownIcon, ChevronUpIcon, WrenchIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  images: z.array(z.instanceof(File)).nonempty('At least one image is required.'),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  systemMessage: z.string().optional(),
  userPrompt: z.string().optional(),
  model: z.enum(['gpt-4o-mini', 'gpt-4o']),
  detail: z.enum(['auto', 'low', 'high']),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<{ filename: string; content: string }[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prefix: '',
      suffix: '',
      systemMessage:
        'Generate a concise, yet detailed comma-separated caption. Do not use markdown. Do not have an intro or outro.',
      userPrompt: 'Describe this image, focusing on the main elements, style, and composition.',
      model: 'gpt-4o-mini',
      detail: 'auto',
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
    formData.append('systemMessage', data.systemMessage || '');
    formData.append('userPrompt', data.userPrompt || '');
    formData.append('model', data.model || '');
    formData.append('detail', data.detail || '');

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
      <main className='container mx-auto max-w-3xl px-4 py-8'>
        <div className='mb-8 flex w-full flex-row justify-end gap-4'>
          <APIKeyManager onApiKeyChange={setApiKey} />
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
                          className='file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 h-14 p-2 file:mr-4 file:h-full file:rounded-lg file:px-4 hover:cursor-pointer hover:file:cursor-pointer'
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
                        <div className='flex items-center gap-2'>
                          <FormLabel>Caption Prefix</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon className='text-muted-foreground hover:text-primary h-4 w-4 cursor-help' />
                              </TooltipTrigger>
                              <TooltipContent className='max-w-[300px]'>
                                <p>
                                  Text to add at the beginning of each caption. Commas and spaces will be handled
                                  automatically, so you can just enter the text.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input {...field} placeholder='Optional prefix...' />
                        </FormControl>
                        <p className='text-muted-foreground mt-1 text-xs'>Example: &quot;CYBRPNK style&quot;</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='suffix'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <FormLabel>Caption Suffix</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon className='text-muted-foreground hover:text-primary h-4 w-4 cursor-help' />
                              </TooltipTrigger>
                              <TooltipContent className='max-w-[300px]'>
                                <p>
                                  Text to add at the end of each caption. Commas and spaces will be handled
                                  automatically, so you can just enter the text.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input {...field} placeholder='Optional suffix...' />
                        </FormControl>
                        <p className='text-muted-foreground mt-1 text-xs'>Example: &quot;high quality 8k&quot;</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Collapsible open={isOpen} onOpenChange={setIsOpen} className='mt-4'>
                  <CollapsibleTrigger asChild>
                    <Button variant='outline' className='flex w-full items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <WrenchIcon className='h-4 w-4' />
                        <span>Advanced Settings</span>
                      </div>
                      {isOpen ? <ChevronUpIcon className='h-4 w-4' /> : <ChevronDownIcon className='h-4 w-4' />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className='mt-4 space-y-4'>
                    <div className='bg-muted/50 rounded-lg border p-4'>
                      <p className='text-muted-foreground text-sm'>
                        These settings control how GPT generates captions for your images. Hover over the{' '}
                        <InfoIcon className='inline h-3 w-3' /> icons for more details.
                      </p>
                    </div>
                    <div className='flex gap-4'>
                      <FormField
                        control={form.control}
                        name='model'
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <FormLabel>Model</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <InfoIcon className='text-muted-foreground hover:text-primary h-4 w-4 cursor-help' />
                                  </TooltipTrigger>
                                  <TooltipContent className='max-w-[300px]'>
                                    <p>
                                      GPT-4o-mini is faster and cheaper, while GPT-4o provides more detailed and
                                      accurate captions.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select model' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='gpt-4o-mini'>GPT-4o-mini (Faster/Cheaper)</SelectItem>
                                <SelectItem value='gpt-4o'>GPT-4o (Better Quality)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='detail'
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <FormLabel>Detail Level</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <InfoIcon className='text-muted-foreground hover:text-primary h-4 w-4 cursor-help' />
                                  </TooltipTrigger>
                                  <TooltipContent className='max-w-[300px]'>
                                    <p>
                                      Controls how detailed the image analysis should be. Higher detail means more
                                      tokens used but better analysis.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select detail level' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='auto'>Auto (Recommended)</SelectItem>
                                <SelectItem value='low'>Low (Faster)</SelectItem>
                                <SelectItem value='high'>High (More Detailed)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name='systemMessage'
                      render={({ field }) => (
                        <FormItem>
                          <div className='flex items-center gap-2'>
                            <FormLabel>System Message</FormLabel>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InfoIcon className='text-muted-foreground hover:text-primary h-4 w-4 cursor-help' />
                                </TooltipTrigger>
                                <TooltipContent className='max-w-[300px]'>
                                  <p>The system message sets the overall behavior and format of the AI.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder='Enter system message...'
                              className='min-h-[80px] resize-y font-mono text-sm'
                            />
                          </FormControl>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            Defines how the AI should approach the caption generation task
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='userPrompt'
                      render={({ field }) => (
                        <FormItem>
                          <div className='flex items-center gap-2'>
                            <FormLabel>User Prompt</FormLabel>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InfoIcon className='text-muted-foreground hover:text-primary h-4 w-4 cursor-help' />
                                </TooltipTrigger>
                                <TooltipContent className='max-w-[300px]'>
                                  <p>
                                    The user prompt is sent along with each image. It specifies what aspects of the
                                    image you want the AI to focus on.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder='Enter user prompt...'
                              className='min-h-[80px] resize-y font-mono text-sm'
                            />
                          </FormControl>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            Specific instructions for analyzing each image
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
            <Button type='submit' className='w-full' size='lg' disabled={loading || !apiKey}>
              {loading ? (
                <>
                  <Loader2Icon className='mr-2 h-5 w-5 animate-spin' />
                  Processing Images...
                </>
              ) : !apiKey ? (
                <>
                  <KeyIcon className='mr-2 h-5 w-5' />
                  API Key Required
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
