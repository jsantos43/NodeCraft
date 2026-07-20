import React from 'react';

// Minimal line icons for error/notice presentation. 20×20, inherit currentColor.
const PATHS = {
  shield: <path d="M10 2.5 4 4.75v4.1c0 3.2 2.4 6.1 6 7.4 3.6-1.3 6-4.2 6-7.4v-4.1L10 2.5Z" />,
  lock: (
    <>
      <rect x="4.5" y="9" width="11" height="7.5" rx="1.5" />
      <path d="M6.75 9V6.75a3.25 3.25 0 0 1 6.5 0V9" />
    </>
  ),
  invalid: (
    <>
      <path d="M10 2.75 1.75 17h16.5L10 2.75Z" />
      <path d="M10 8v3.5" />
      <path d="M10 14h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="9" cy="9" r="5.25" />
      <path d="m13 13 4 4" />
    </>
  ),
  server: (
    <>
      <rect x="3" y="4" width="14" height="5" rx="1.5" />
      <rect x="3" y="11" width="14" height="5" rx="1.5" />
      <path d="M6.5 6.5h.01M6.5 13.5h.01" />
    </>
  ),
  offline: (
    <>
      <path d="M2.5 7.5a11 11 0 0 1 15 0" />
      <path d="M5.5 10.5a7 7 0 0 1 9 0" />
      <path d="M8.5 13.5a3 3 0 0 1 3 0" />
      <path d="M10 16.5h.01" />
      <path d="m3 3 14 14" />
    </>
  ),
  check: <path d="m4.5 10.5 3.5 3.5 7.5-8" />,
};

export default function AlertIcon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name] || PATHS.server}
    </svg>
  );
}
