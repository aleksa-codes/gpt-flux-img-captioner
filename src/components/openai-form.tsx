'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2Icon, ImageIcon, FileTextIcon, InfoIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDownIcon, ChevronUpIcon, WrenchIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const openaiFormSchema = z.object({
  images: z.array(z.instanceof(File)).nonempty('At least one image is required.'),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  systemMessage: z.string().optional(),
  userPrompt: z.string().optional(),
  model: z.string(),
  detail: z.enum(['auto', 'low', 'high']).optional(),
});

type OpenAIFormValues = z.infer<typeof openaiFormSchema>;

interface OpenAIFormProps {
  apiKey: string | null;
  onSubmit: (captions: { filename: string; content: string }[]) => void;
  onProgress: (caption: { filename: string; content: string }) => void; // New prop for real-time updates
  onError: (error: string) => void;
}

export default function OpenAIForm({ apiKey, onSubmit, onProgress, onError }: OpenAIFormProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [captionCount, setCaptionCount] = useState(0); // Track number of processed captions

  const form = useForm<OpenAIFormValues>({
    resolver: zodResolver(openaiFormSchema),
    defaultValues: {
      prefix: '',
      suffix: '',
      systemMessage:
        'Generate a concise, yet detailed comma-separated caption. Do not use markdown. Do not have an intro or outro.',
      userPrompt: 'Describe this image, focusing on the main elements, style, and composition.',
      model: 'gpt-4.1-nano',
      detail: 'auto',
    },
  });

  const handleSubmit = async (data: OpenAIFormValues) => {
    if (data.images.length === 0) {
      onError('At least one image is required.');
      return;
    }

    if (!apiKey) {
      onError('OpenAI API key is required');
      return;
    }

    setLoading(true);
    setCaptionCount(0); // Reset caption count

    const formData = new FormData();
    for (let i = 0; i < data.images.length; i++) {
      formData.append('images', data.images[i]);
    }
    formData.append('prefix', data.prefix || '');
    formData.append('suffix', data.suffix || '');
    formData.append('systemMessage', data.systemMessage || '');
    formData.append('userPrompt', data.userPrompt || '');
    formData.append('service', 'openai');
    formData.append('model', data.model || '');
    formData.append('detail', data.detail || 'auto');
    formData.append('apiKey', apiKey);

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
                onError(caption.substring(7));
                setLoading(false);
                return;
              } else {
                // Send each caption to the parent as it's received
                const newCaption = { filename, content: caption };
                tempCaptions.push(newCaption);
                onProgress(newCaption); // Send real-time update to parent
                setCaptionCount((prev) => prev + 1);
              }
            }
          }
        }
      }

      onSubmit(tempCaptions);
    } catch (err) {
      onError('An unexpected error occurred.');
      console.error('Submission error:', err);
    }

    setLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
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
                              Text to add at the end of each caption. Commas and spaces will be handled automatically,
                              so you can just enter the text.
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

            <FormField
              control={form.control}
              name='model'
              render={({ field }) => (
                <FormItem className='mt-4'>
                  <FormLabel>Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select model' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='gpt-4.1-nano'>GPT-4.1-nano (Faster/Cheaper)</SelectItem>
                      <SelectItem value='gpt-4.1-mini'>GPT-4.1-mini (Balanced)</SelectItem>
                      <SelectItem value='gpt-4.1'>GPT-4.1 (Better Quality)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='detail'
              render={({ field }) => (
                <FormItem className='mt-4'>
                  <div className='flex items-center gap-2'>
                    <FormLabel>Detail Level</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className='text-muted-foreground hover:text-primary h-4 w-4 cursor-help' />
                        </TooltipTrigger>
                        <TooltipContent className='max-w-[300px]'>
                          <p>
                            Controls how detailed the image analysis should be. Higher detail means more tokens used but
                            better analysis.
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
                </FormItem>
              )}
            />

            {!apiKey && (
              <Alert variant='destructive' className='mt-4'>
                <AlertTitle className='flex items-center gap-2'>API Key Required</AlertTitle>
                <AlertDescription>
                  Please add your OpenAI API key in the top right corner before proceeding.
                </AlertDescription>
              </Alert>
            )}

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
                    These settings control how the AI generates captions for your images. Hover over the{' '}
                    <InfoIcon className='inline h-3 w-3' /> icons for more details.
                  </p>
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
                                The user prompt is sent along with each image. It specifies what aspects of the image
                                you want the AI to focus on.
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
              Processing Images... {captionCount > 0 ? `(${captionCount} done)` : ''}
            </>
          ) : !apiKey ? (
            <>
              <ImageIcon className='mr-2 h-5 w-5' />
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
  );
}
