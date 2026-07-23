import { useEffect, useMemo, useRef, useState } from 'react';

interface EditableSmartAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const EditableSmartAutocomplete = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = '',
  id
}: EditableSmartAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = useMemo(() => {
    const uniqueOptions = Array.from(new Set(options.map((option) => String(option || '').trim()).filter(Boolean)));
    return uniqueOptions.sort((left, right) => left.localeCompare(right));
  }, [options]);

  const filteredOptions = useMemo(() => {
    const trimmedValue = value.trim().toLowerCase();
    if (!trimmedValue) {
      return normalizedOptions;
    }

    const hasExactMatch = normalizedOptions.some((option) => option.toLowerCase() === trimmedValue);
    if (hasExactMatch) {
      return normalizedOptions;
    }

    return normalizedOptions.filter((option) => option.toLowerCase().includes(trimmedValue));
  }, [normalizedOptions, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={(event) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (nextTarget && containerRef.current?.contains(nextTarget)) {
            return;
          }
          setIsOpen(false);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="off"
      />

      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-muted bg-white shadow-lg">
          {filteredOptions.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-background"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EditableSmartAutocomplete;
