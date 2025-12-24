import type { Metadata } from 'next'
import './globals.css'
import { CustomCursor } from '@/components/CustomCursor'
// import { FibonacciBackground } from '@/components/FibonacciBackground'

export const metadata: Metadata = {
  title: 'akhai · sovereign intelligence',
  description: 'Multi-AI consensus research engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>◊</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Suppress wallet extension errors - runs early in head */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                
                // Wrap Object.defineProperty BEFORE extensions load to prevent redefinition errors
                const originalDefineProperty = Object.defineProperty;
                Object.defineProperty = function(obj, prop, descriptor) {
                  if (obj === window && prop === 'ethereum') {
                    // If ethereum already exists and is non-configurable, silently ignore redefinition attempts
                    const existing = Object.getOwnPropertyDescriptor(window, 'ethereum');
                    if (existing && !existing.configurable) {
                      return window; // Silently ignore
                    }
                    try {
                      return originalDefineProperty.call(this, obj, prop, descriptor);
                    } catch (e) {
                      // Silently ignore redefinition errors for window.ethereum
                      return window;
                    }
                  }
                  try {
                    return originalDefineProperty.call(this, obj, prop, descriptor);
                  } catch (e) {
                    // For other properties, still throw if it's a real error
                    throw e;
                  }
                };
                
                // Suppress wallet extension console errors and warnings
                const originalError = console.error;
                const originalWarn = console.warn;
                console.error = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('window.ethereum') || 
                      message.includes('Cannot redefine property: ethereum') ||
                      message.includes('Failed to set window.ethereum') ||
                      message.includes('wallet') || 
                      message.includes('MetaMask') ||
                      message.includes('evmAsk')) {
                    return; // Suppress wallet-related errors
                  }
                  originalError.apply(console, args);
                };
                console.warn = function(...args) {
                  // Convert all args to string for comprehensive pattern matching
                  const message = args.map(arg => {
                    if (typeof arg === 'string') return arg;
                    if (typeof arg === 'object' && arg !== null) {
                      try { return JSON.stringify(arg); } catch { return String(arg); }
                    }
                    return String(arg);
                  }).join(' ');
                  
                  // Case-insensitive check for wallet-related warnings
                  const lowerMessage = message.toLowerCase();
                  const firstArg = args.length > 0 ? String(args[0]).toLowerCase() : '';
                  
                  // Check for wallet extension patterns (comprehensive matching)
                  const isWalletWarning = 
                    lowerMessage.includes('ethereum') || 
                    lowerMessage.includes('failed to set') ||
                    lowerMessage.includes('cannot redefine property') ||
                    lowerMessage.includes('wallet') || 
                    lowerMessage.includes('metamask') ||
                    lowerMessage.includes('evmask') ||
                    lowerMessage.includes('in-page.js') ||
                    firstArg.includes('ethereum') ||
                    firstArg.includes('failed to set') ||
                    message.includes('window.ethereum') ||
                    message.includes('Failed to set window.ethereum');
                  
                  if (isWalletWarning) {
                    return; // Suppress wallet-related warnings silently
                  }
                  originalWarn.apply(console, args);
                };
                
                // Global error handler for uncaught errors (capture phase)
                const originalErrorHandler = window.onerror;
                window.onerror = function(message, source, lineno, colno, error) {
                  if (message && (
                    typeof message === 'string' && (
                      message.includes('ethereum') ||
                      message.includes('Cannot redefine property') ||
                      message.includes('evmAsk') ||
                      message.includes('Failed to set')
                    )
                  )) {
                    return true; // Suppress error
                  }
                  if (originalErrorHandler) {
                    return originalErrorHandler.call(this, message, source, lineno, colno, error);
                  }
                  return false;
                };
                
                // Also add event listener for unhandled promise rejections
                window.addEventListener('unhandledrejection', function(e) {
                  const reason = e.reason;
                  if (reason && typeof reason === 'object' && reason.message) {
                    const msg = reason.message.toString();
                    if (msg.includes('ethereum') || msg.includes('evmAsk')) {
                      e.preventDefault();
                      return false;
                    }
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className="font-mono antialiased bg-relic-white">
        {/* <FibonacciBackground /> */}
        <CustomCursor />
        {children}
      </body>
    </html>
  )
}
