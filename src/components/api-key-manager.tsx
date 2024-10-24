import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldQuestionIcon, KeyIcon, TrashIcon, SaveIcon } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface APIKeyManagerProps {
  onApiKeyChange: (key: string) => void;
  localStorageKey?: string;
  apiKeyPattern?: RegExp;
  label?: string;
  description?: string;
  tooltipText?: string;
  saveButtonText?: string;
  removeButtonText?: string;
}

export default function APIKeyManager({
  onApiKeyChange,
  localStorageKey = 'api-key',
  apiKeyPattern = /^sk-[\w-]{20,42}T3BlbkFJ[\w-]{20,42}$/,
  label = 'OpenAI API Key',
  description = 'Please remove your API key after you are done using the app.',
  tooltipText = "Your API key is securely stored in the browser's local storage and is only utilized when making requests to OpenAI via their official SDK.",
  saveButtonText = 'Save API Key',
  removeButtonText = 'Remove Key',
}: APIKeyManagerProps) {
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

  useEffect(() => {
    const storedApiKey = localStorage.getItem(localStorageKey);
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsKeySet(true);
      onApiKeyChange(storedApiKey);
    }
  }, [localStorageKey, onApiKeyChange]);

  const handleSaveApiKey = () => {
    if (apiKey.trim() === '') {
      setMessage({ text: 'API key cannot be empty.', type: 'error' });
      return;
    }

    if (!apiKeyPattern.test(apiKey)) {
      setMessage({ text: 'Invalid API key format.', type: 'error' });
      return;
    }

    localStorage.setItem(localStorageKey, apiKey);
    setIsKeySet(true);
    setMessage({ text: 'API key saved successfully!', type: 'success' });
    onApiKeyChange(apiKey);
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem(localStorageKey);
    setApiKey('');
    setIsKeySet(false);
    setMessage({ text: 'API key removed successfully.', type: 'success' });
    onApiKeyChange('');
  };

  return (
    <Card className='fixed bottom-4 right-4 z-50 w-96 shadow-lg'>
      <CardHeader className='space-y-1 pb-4'>
        <CardTitle className='flex items-center gap-2'>
          <KeyIcon className='h-5 w-5 text-primary' />
          <span>{label}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ShieldQuestionIcon className='ml-1 h-4 w-4 cursor-help text-muted-foreground transition-colors hover:text-primary' />
              </TooltipTrigger>
              <TooltipContent side='left' className='max-w-xs'>
                <p className='text-sm'>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className='text-sm'>{description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='relative space-y-2'>
          <div className='flex rounded-md shadow-sm'>
            <Input
              type='password'
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder='sk-aBC123xyz...'
              disabled={isKeySet}
              className='pr-4'
            />
          </div>
          {message.text && (
            <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
              <AlertDescription className='text-sm'>{message.text}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {!isKeySet ? (
          <Button onClick={handleSaveApiKey} className='w-full' variant='default'>
            <SaveIcon className='mr-2 h-4 w-4' />
            {saveButtonText}
          </Button>
        ) : (
          <Button onClick={handleRemoveApiKey} className='w-full' variant='destructive'>
            <TrashIcon className='mr-2 h-4 w-4' />
            {removeButtonText}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
