'use client';

import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

export default function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div
        className={cn(
          'relative bg-white rounded-2xl shadow-xl w-full flex flex-col max-h-[90vh]',
          'max-h-[92dvh] rounded-b-none sm:rounded-b-2xl',
          sizeClasses[size]
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 flex-1 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</div>
        )}
      </div>
    </div>
  );
}
