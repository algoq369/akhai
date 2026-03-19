'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'monospace', background: '#0a0a0a', color: '#e5e5e5' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚠</div>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Critical Error</h2>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '32px' }}>
              {error.digest ? `ID: ${error.digest}` : 'The application encountered a fatal error'}
            </p>
            <button
              onClick={reset}
              style={{
                padding: '12px 24px',
                fontSize: '13px',
                fontFamily: 'monospace',
                background: 'transparent',
                color: '#e5e5e5',
                cursor: 'pointer',
                border: '1px solid #333',
              }}
            >
              ↻ Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
