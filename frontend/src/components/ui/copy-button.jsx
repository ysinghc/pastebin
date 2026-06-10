import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Copy, Check } from 'lucide-react';
import { Button } from './button';

const CopyButton = ({ text, className, label = 'Copy', copiedLabel = 'Copied!' }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={copyToClipboard}
      className={cn('gap-1.5', className)}
    >
      {isCopied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
};

export { CopyButton };
