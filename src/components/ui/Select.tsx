import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  compact?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, compact, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="group relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'themed-select block w-full appearance-none cursor-pointer rounded-xl border border-primary-100 bg-white text-sm text-gray-900 shadow-sm',
              'pl-3 pr-10 transition-colors hover:border-primary-300 hover:bg-primary-50/30',
              compact ? 'py-2' : 'py-2.5',
              'focus:border-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-100',
              error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : '',
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-hover:text-primary-700"
            aria-hidden
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';
export default Select;
