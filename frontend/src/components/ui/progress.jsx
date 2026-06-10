import React from 'react';
import { cn } from '../../lib/utils';

const Progress = React.forwardRef(({ className, value, max = 100, ...props }, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const indicatorColor =
    percentage < 10 ? 'bg-red-500' :
    percentage < 25 ? 'bg-yellow-500' :
    'bg-green-500';

  return (
    <div
      ref={ref}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-gray-200',
        className
      )}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-500 ease-in-out', indicatorColor)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
});

Progress.displayName = 'Progress';

export { Progress };
