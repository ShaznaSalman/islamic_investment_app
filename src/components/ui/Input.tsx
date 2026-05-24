import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex">
          {leftAddon && (
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              {leftAddon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full text-sm text-gray-900 bg-white border border-gray-300',
              'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent',
              'transition-colors',
              leftAddon ? 'rounded-r-lg' : 'rounded-lg',
              error ? 'border-red-400 focus:ring-red-500' : '',
              'px-3 py-2',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
