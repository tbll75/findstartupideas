"use client";

interface SearchErrorProps {
  message: string;
}

/**
 * Error message display
 */
export function SearchError({ message }: SearchErrorProps) {
  return (
    <div className="mt-6 px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/20 text-sm text-destructive">
      {message}
    </div>
  );
}
