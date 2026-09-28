import React from 'react';

// Small inline icon set (Lucide-style strokes) — no extra dependency needed.
function Icon({ children, className = 'h-4 w-4', ...rest }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const Logo = (p) => (
  <Icon {...p}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></Icon>
);
export const UploadIcon = (p) => (<Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></Icon>);
export const FileIcon = (p) => (<Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></Icon>);
export const SparkIcon = (p) => (<Icon {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z" /></Icon>);
export const CheckIcon = (p) => (<Icon {...p}><path d="M20 6L9 17l-5-5" /></Icon>);
export const AlertIcon = (p) => (<Icon {...p}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></Icon>);
export const XIcon = (p) => (<Icon {...p}><path d="M18 6L6 18M6 6l12 12" /></Icon>);
export const MinusIcon = (p) => (<Icon {...p}><path d="M5 12h14" /></Icon>);
export const PrintIcon = (p) => (<Icon {...p}><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></Icon>);
export const TrashIcon = (p) => (<Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></Icon>);
export const ChevronIcon = (p) => (<Icon {...p}><path d="M9 18l6-6-6-6" /></Icon>);
export const SearchIcon = (p) => (<Icon {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Icon>);
export const DatabaseIcon = (p) => (<Icon {...p}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></Icon>);
export const ChartIcon = (p) => (<Icon {...p}><path d="M3 3v18h18" /><path d="M7 16v-4M12 16V8M17 16v-7" /></Icon>);
export const RefreshIcon = (p) => (<Icon {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" /><path d="M21 3v5h-5" /></Icon>);
export const SpinnerIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
