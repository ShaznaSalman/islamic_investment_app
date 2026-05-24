'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  id?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label,
  className,
  id = 'search',
}: SearchInputProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 text-sm text-gray-900 shadow-sm',
            'placeholder:text-gray-400 transition-colors',
            'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600',
            value ? 'pr-10' : 'pr-3',
          )}
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
