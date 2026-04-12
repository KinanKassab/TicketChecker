"use client";

import { useEffect, useId, useRef, useState } from "react";

type DropdownOption<T extends string> = {
  value: T;
  label: string;
};

type ProjectDropdownProps<T extends string> = {
  label: string;
  placeholder: string;
  value: T | "";
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

export default function ProjectDropdown<T extends string>({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
}: ProjectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const listboxId = useId();

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <label id={labelId} className="text-sm font-bold text-white/90">
        {label}
      </label>

      <button
        type="button"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen((prev) => !prev);
        }}
        className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-colors focus:ring-2 focus:ring-[#b4e237] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selectedOption ? "text-white" : "text-white/60"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-white/75 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen ? (
        <div
          className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-white/25 bg-[#274c97]/95 shadow-2xl backdrop-blur-xl"
          role="presentation"
        >
          <ul id={listboxId} role="listbox" aria-labelledby={labelId} className="max-h-56 overflow-y-auto py-1">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? "bg-[#b4e237]/25 text-white"
                      : "text-white/90 hover:bg-white/15"
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
