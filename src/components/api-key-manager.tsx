'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldQuestionIcon, KeyIcon, TrashIcon, SaveIcon, CheckCircleIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

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
  apiKeyPattern = /^sk-[a-zA-Z0-9-_]{1,250}$/,
  label = 'OpenAI API Key',
  description = 'Please remove your API key when you are done using the app for security reasons.',
  tooltipText = "Your API key is securely stored in the browser's local storage and is only utilized when making requests to OpenAI via their official SDK.",
  saveButtonText = 'Save API Key',
  removeButtonText = 'Remove Key',
}: APIKeyManagerProps) {
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [isOpen, setIsOpen] = useState(false);

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={isKeySet ? 'outline' : 'default'}>
          {isKeySet ? (
            <>
              <CheckCircleIcon className='mr-2 h-4 w-4 text-green-500' />
              API Key Set
            </>
          ) : (
            <>
              <KeyIcon className='mr-2 h-4 w-4' />
              Set API Key
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span>{label}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ShieldQuestionIcon className='size-5 cursor-help text-blue-500 transition-colors hover:text-primary' />
                </TooltipTrigger>
                <TooltipContent side='top' className='max-w-xs'>
                  <p className='text-sm'>{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
          <DialogDescription className='text-sm'>{description}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
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
        </div>
        <DialogFooter className='flex flex-col space-y-2'>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
