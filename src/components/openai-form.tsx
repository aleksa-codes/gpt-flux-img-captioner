'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2Icon, ImageIcon, FileTextIcon, InfoIcon, KeyIcon, XIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDownIcon, ChevronUpIcon, WrenchIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import APIKeyManager from '@/components/api-key-manager';

// Image validation constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const openaiFormSchema = z.object({
  images: z
    .array(z.instanceof(File))
    .nonempty('At least one image is required.')
    .refine(
      (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
      'Each image must be less than 20MB.'
    )
    .refine(
      (files) => files.every((file) => ALLOWED_IMAGE_TYPES.includes(file.type)),
      'Only JPEG, PNG, WebP, and GIF images are allowed.'
    ),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  systemMessage: z.string().optional(),
  userPrompt: z.string().optional(),
  model: z.string(),
  detail: z.enum(['auto', 'low', 'high']).optional(),
});

type OpenAIFormValues = z.infer<typeof openaiFormSchema>;

interface OpenAIFormProps {
  initialApiKey: string | null;
  onApiKeyChange: (key: string | null) => void;
  onSubmit: (captions: { filename: string; content: string }[]) => void;
  onProgress: (caption: { filename: string; content: string }) => void;
  onError: (error: string) => void;
  onImagesSelected: (files: File[]) => void;
}

export default function OpenAIForm({ initialApiKey, onApiKeyChange, onSubmit, onProgress, onError, onImagesSelected }: OpenAIFormProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [captionCount, setCaptionCount] = useState(0);
  const [apiKey, setApiKey] = useState<string | null>(initialApiKey);
  const [imagePreviews, setImagePreviews] = useState<{ file: File; preview: string }[]>([]);

  useEffect(() => {
    onApiKeyChange(apiKey);
  }, [apiKey, onApiKeyChange]);

  // Cleanup image previews on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [imagePreviews]);

  const handleImageChange = (files: File[]) => {
    // Revoke old previews
    imagePreviews.forEach((img) => URL.revokeObjectURL(img.preview));

    // Create new previews
    const newPreviews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImagePreviews(newPreviews);

    // Notify parent component
    onImagesSelected(files);
  };

  const removeImage = (index: number) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviews[index].preview);
    setImagePreviews(newPreviews);

    // Update form state
    const newFiles = newPreviews.map((p) => p.file);
    form.setValue('images', newFiles);

    // Notify parent component
    onImagesSelected(newFiles);
  };

  const form = useForm<OpenAIFormValues>({
    resolver: zodResolver(openaiFormSchema),
    defaultValues: {
      prefix: '',
      suffix: '',
      systemMessage:
        'Generate a concise, yet detailed comma-separated caption. Do not use markdown. Do not have an intro or outro.',
      userPrompt: 'Describe this image, focusing on the main elements, style, and composition.',
      model: 'gpt-5-nano',
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
    setCaptionCount(0);

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
                const newCaption = { filename, content: caption };
                tempCaptions.push(newCaption);
                onProgress(newCaption);
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
          <CardHeader className='pb-0'>
            <CardTitle className='flex items-center justify-between text-lg'>
              <div />
              <APIKeyManager onApiKeyChange={setApiKey} />
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-4'>
            <div className='mb-4'>
              <FormField
                control={form.control}
                name='model'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select model' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='gpt-5-nano'>GPT-5-nano (Faster/Cheaper)</SelectItem>
                        <SelectItem value='gpt-5-mini'>GPT-5-mini (Balanced)</SelectItem>
                        <SelectItem value='gpt-5'>GPT-5 (Better Quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

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
                        handleImageChange(files);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className='mt-4'>
                <div className='mb-2 flex items-center justify-between'>
                  <p className='text-sm font-medium'>
                    Selected Images ({imagePreviews.length})
                  </p>
                  <Badge variant='secondary'>
                    {(imagePreviews.reduce((acc, img) => acc + img.file.size, 0) / (1024 * 1024)).toFixed(2)} MB
                  </Badge>
                </div>
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
                  {imagePreviews.map((img, index) => (
                    <div key={index} className='group relative'>
                      <div className='bg-muted aspect-square overflow-hidden rounded-lg border'>
                        <img
                          src={img.preview}
                          alt={img.file.name}
                          className='h-full w-full object-cover'
                        />
                      </div>
                      <Button
                        type='button'
                        variant='destructive'
                        size='icon'
                        className='absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100'
                        onClick={() => removeImage(index)}
                      >
                        <XIcon className='h-4 w-4' />
                      </Button>
                      <p className='text-muted-foreground mt-1 truncate text-xs' title={img.file.name}>
                        {img.file.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!apiKey && (
              <Alert variant='destructive' className='mt-4'>
                <AlertTitle className='flex items-center gap-2'>API Key Required</AlertTitle>
                <AlertDescription>
                  Please add your OpenAI API key using the &quot;Set API Key&quot; button above before proceeding.
                </AlertDescription>
              </Alert>
            )}

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
  );
}
