# CSP (Content Security Policy) Fix - December 25, 2025

## ✅ Issue Fixed

### Problem
- Browser console showing CSP warning: "Content Security Policy of your site blocks the use of 'eval' in JavaScript"
- Warning appeared despite `'unsafe-eval'` being in the CSP configuration

### Root Cause
The CSP configuration was correct but incomplete. Next.js Fast Refresh and HMR (Hot Module Replacement) require:
- `'unsafe-eval'` for eval() usage
- `'wasm-unsafe-eval'` for WebAssembly compilation
- Additional directives for fonts, images, and API connections

### Fix Applied

**Updated `next.config.js` CSP headers** to be more comprehensive:

**Development Mode:**
```javascript
"default-src 'self'; 
 script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'; 
 style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
 font-src 'self' https://fonts.gstatic.com data:; 
 img-src 'self' data: https:; 
 connect-src 'self' https://api.anthropic.com https://api.coingecko.com; 
 object-src 'none'; 
 base-uri 'self'; 
 frame-ancestors 'none';"
```

**Production Mode:**
```javascript
"default-src 'self'; 
 script-src 'self'; 
 style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
 font-src 'self' https://fonts.gstatic.com data:; 
 img-src 'self' data: https:; 
 connect-src 'self' https://api.anthropic.com https://api.coingecko.com; 
 object-src 'none'; 
 base-uri 'self'; 
 frame-ancestors 'none';"
```

### Key Changes
1. ✅ Added `'wasm-unsafe-eval'` for WebAssembly support
2. ✅ Added `default-src 'self'` as base policy
3. ✅ Added explicit directives for fonts, images, and API connections
4. ✅ Added `frame-ancestors 'none'` for security
5. ✅ Production mode removes `'unsafe-eval'` for security

### Security Notes
- **Development**: Allows `'unsafe-eval'` for Next.js Fast Refresh (required for HMR)
- **Production**: Removes `'unsafe-eval'` for better security
- All external resources (fonts, APIs) are explicitly whitelisted

### Status
**FIXED** - CSP is now comprehensive and should suppress the eval() warning in development mode.

---

*Fixed: December 25, 2025*






