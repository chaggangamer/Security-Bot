'use client';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="statePage">
      <h1>Security dashboard unavailable</h1>
      <p>The error was contained. No Discord action was taken.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
