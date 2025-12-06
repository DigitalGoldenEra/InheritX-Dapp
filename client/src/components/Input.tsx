'use client';

import { ReactNode } from 'react';
import { FiUpload, FiCheck } from 'react-icons/fi';

interface InputProps {
  label?: string;
  name: string;
  type?: 'text' | 'email' | 'date' | 'select' | 'file' | 'textarea';
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  className?: string;
  colSpan?: number;
  accept?: string;
  file?: File | null;
  disabled?: boolean;
}

/**
 * Reusable Input Component
 * 
 * Supports multiple input types:
 * - text, email, date: Standard input fields
 * - select: Dropdown with options
 * - file: File upload with preview
 * - textarea: Multi-line text input
 * 
 * @param label - Label text displayed above the input
 * @param name - Input name attribute (for form handling)
 * @param type - Input type (text, email, date, select, file, textarea)
 * @param value - Controlled input value
 * @param onChange - Handler for input changes
 * @param onFileChange - Handler for file input changes (required for type="file")
 * @param placeholder - Placeholder text
 * @param required - Whether the field is required
 * @param options - Options array for select type
 * @param className - Additional CSS classes
 * @param colSpan - Grid column span (for responsive layouts)
 * @param accept - File types accepted (for file input)
 * @param file - File object (for file input preview)
 * @param disabled - Whether the input is disabled
 */
export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onFileChange,
  placeholder,
  required = false,
  options = [],
  className = '',
  colSpan,
  accept,
  file,
  disabled = false,
}: InputProps) {
  // Base input group classes
  // Map colSpan to Tailwind grid column classes
  const colSpanClasses: Record<number, string> = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
  };
  const inputGroupClasses = `input-group ${colSpan ? colSpanClasses[colSpan] || '' : ''} ${className}`.trim();

  // File upload component (special handling)
  if (type === 'file') {
    return (
      <div className={inputGroupClasses}>
        {label && (
          <label className="input-label">
            {label} {required && '*'}
          </label>
        )}
        <div className="mt-2">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/6 rounded-xl cursor-pointer hover:border-primary transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <>
                  <FiCheck className="text-[#10B981] mb-2" size={24} />
                  <p className="text-sm text-[#A0AEC0]">{file.name}</p>
                  <p className="text-xs text-[#64748B]">Click to replace</p>
                </>
              ) : (
                <>
                  <FiUpload className="text-primary mb-2" size={24} />
                  <p className="text-sm text-[#A0AEC0]">Click to upload</p>
                  <p className="text-xs text-[#64748B]">
                    {accept ? accept.replace(/\./g, '').toUpperCase() : 'JPEG, PNG or PDF'} (max 5MB)
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              name={name}
              className="hidden"
              accept={accept}
              onChange={onFileChange}
              required={required}
              disabled={disabled}
            />
          </label>
        </div>
      </div>
    );
  }

  // Select dropdown component
  if (type === 'select') {
    return (
      <div className={inputGroupClasses}>
        {label && (
          <label htmlFor={name} className="input-label">
            {label} {required && '*'}
          </label>
        )}
        <select
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          className="input"
          required={required}
          disabled={disabled}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Textarea component
  if (type === 'textarea') {
    return (
      <div className={inputGroupClasses}>
        {label && (
          <label htmlFor={name} className="input-label">
            {label} {required && '*'}
          </label>
        )}
        <textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          className="input"
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={4}
        />
      </div>
    );
  }

  // Standard input (text, email, date)
  return (
    <div className={inputGroupClasses}>
      {label && (
        <label htmlFor={name} className="input-label">
          {label} {required && '*'}
        </label>
      )}
      <input
        id={name}
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        className="input"
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}
