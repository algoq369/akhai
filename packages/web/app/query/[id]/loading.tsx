export default function Loading() {
  // V6-Block2c: instant route-transition feedback (nav fluidity)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="h-7 w-7 animate-spin rounded-full border-2 border-current/20 border-t-current/70 opacity-60"
        aria-label="Loading"
      />
    </div>
  );
}
