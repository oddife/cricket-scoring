"use client";

type ErrorBannerProps = {
  error: string;
};

export default function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) {
    return null;
  }

  return (
    <div className="mb-5 rounded-2xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300 [color-scheme:dark]">
      {error}
    </div>
  );
}