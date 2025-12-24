# Authentication Setup Guide

## GitHub OAuth Setup

To enable GitHub authentication, you need to:

1. **Create a GitHub OAuth App:**
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Application name: `AkhAI` (or your choice)
   - Homepage URL: `http://localhost:3004` (or your production URL)
   - Authorization callback URL: `http://localhost:3004/api/auth/github/callback` (or your production callback URL)
   - Click "Register application"

2. **Add to `.env.local`:**
   ```bash
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   GITHUB_REDIRECT_URI=http://localhost:3004/api/auth/github/callback
   ```

3. **For Production:**
   - Update the callback URL in GitHub OAuth App settings
   - Set `GITHUB_REDIRECT_URI` in your production environment variables

## Web3 Wallet Setup

The app uses standard Web3 wallet providers:
- **MetaMask** (most common)
- **Coinbase Wallet**
- **WalletConnect** (if available)
- Any wallet that injects `window.ethereum`

No additional configuration needed - users just need to have a Web3 wallet installed in their browser.

## Current Status

- ✅ Web3 wallet connection implemented (MetaMask, Coinbase Wallet, etc.)
- ✅ GitHub OAuth implemented (requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)
- ✅ Error handling and user feedback added
- ✅ Session management working

## Troubleshooting

**GitHub OAuth 404 Error:**
- Make sure `GITHUB_CLIENT_ID` is set in `.env.local`
- Verify the callback URL matches your GitHub OAuth App settings
- Check that the port matches your dev server (default: 3004)

**Web3 Wallet Not Detected:**
- User needs to install MetaMask or another Web3 wallet browser extension
- Make sure the wallet is unlocked
- Try refreshing the page after installing the wallet

