import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface FieldWrapProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

/** Shared label + error scaffolding for all form controls. */
export function FieldWrap({ label, htmlFor, error, hint, required, children }: FieldWrapProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={htmlFor} className="label-base">
          {label}
          {required && <span className="ml-0.5 text-status-suspended">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-status-suspended" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, id, className, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <FieldWrap label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn('input-base', error && 'border-status-suspended focus-visible:border-status-suspended', className)}
          {...props}
        />
      </FieldWrap>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, id, className, options, placeholder, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <FieldWrap label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
        <select
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn('input-base cursor-pointer appearance-none pr-9 bg-[length:1.1rem] bg-[right_0.6rem_center] bg-no-repeat',
            'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20fill=%27none%27%20viewBox=%270%200%2024%2024%27%20stroke=%27%238a96aa%27%20stroke-width=%272%27%3E%3Cpath%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20d=%27M19%209l-7%207-7-7%27/%3E%3C/svg%3E")]',
            error && 'border-status-suspended', className)}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      </FieldWrap>
    );
  }
);
Select.displayName = 'Select';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, id, className, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <FieldWrap label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn('input-base min-h-[80px] resize-y', error && 'border-status-suspended', className)}
          {...props}
        />
      </FieldWrap>
    );
  }
);
Textarea.displayName = 'Textarea';
