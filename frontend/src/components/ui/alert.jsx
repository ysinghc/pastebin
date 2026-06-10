import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const Alert = React.forwardRef(({ className, variant = 'info', title, children, ...props }, ref) => {
  const variants = {
    info: {
      container: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: <Info className="h-4 w-4" />,
    },
    success: {
      container: 'bg-green-50 text-green-800 border-green-200',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    warning: {
      container: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    error: {
      container: 'bg-red-50 text-red-800 border-red-200',
      icon: <AlertCircle className="h-4 w-4" />,
    },
  };

  const currentVariant = variants[variant] || variants.info;

  return (
    <div
      ref={ref}
      className={cn(
        'relative w-full rounded-lg border p-4',
        currentVariant.container,
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{currentVariant.icon}</div>
        <div className="flex-1">
          {title && <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
});

Alert.displayName = 'Alert';

export { Alert };
