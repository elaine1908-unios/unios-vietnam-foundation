// Marks an off-shore employee wherever their name is shown — green,
// currentColor-independent (always green regardless of surrounding text
// color) since it's a status indicator, not decorative text.
export function OffshoreIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-green-600 ${className ?? ""}`}
      role="img"
      aria-label="Off-shore"
    >
      <title>Off-shore</title>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
