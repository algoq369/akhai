'use client'

import { useState } from 'react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [authMethod, setAuthMethod] = useState<'github' | 'wallet' | 'github-error' | null>(null)
  const [walletAddress, setWalletAddress] = useState('')
  const [walletMessage, setWalletMessage] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)

  if (!isOpen) return null

  const handleGitHubAuth = async () => {
    if (isGitHubLoading) return
    
    try {
      setIsGitHubLoading(true)
      const response = await fetch('/api/auth/github')
      const data = await response.json()
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        setIsGitHubLoading(false)
        setAuthMethod('github-error')
      }
    } catch (error) {
      console.error('GitHub auth error:', error)
      setIsGitHubLoading(false)
      setAuthMethod('github-error')
    }
  }

  const handleWalletConnect = async () => {
    if (isConnecting) return
    
    try {
      setIsConnecting(true)
      
      const provider = (window as any).ethereum
      
      if (!provider) {
        alert('No Web3 wallet detected. Please install MetaMask.')
        setIsConnecting(false)
        return
      }
      
      // Request with timeout
      const timeoutId = setTimeout(() => {
        setIsConnecting(false)
        alert('Wallet connection timed out. Please try again.')
      }, 30000)
      
      try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' })
        clearTimeout(timeoutId)
        
        const address = accounts[0]
        if (!address) {
          throw new Error('No wallet address found')
        }
        
        setWalletAddress(address)
        
        const response = await fetch('/api/auth/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to get signature message')
        }
        
        const data = await response.json()
        setWalletMessage(data.message)
        setAuthMethod('wallet')
      } catch (err) {
        clearTimeout(timeoutId)
        throw err
      }
    } catch (error) {
      console.error('Wallet connect error:', error)
      const msg = error instanceof Error ? error.message : 'Connection failed'
      if (!msg.includes('rejected')) {
        alert(`Wallet error: ${msg}`)
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const handleWalletSign = async () => {
    try {
      if (!walletAddress || !walletMessage) return

      const provider = (window as any).ethereum
      const signature = await provider.request({
        method: 'personal_sign',
        params: [walletMessage, walletAddress],
      })

      const verifyResponse = await fetch('/api/auth/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress, signature, message: walletMessage }),
      })

      const data = await verifyResponse.json()
      
      if (data.success) {
        onSuccess()
        onClose()
      } else {
        throw new Error(data.error || 'Authentication failed')
      }
    } catch (error) {
      console.error('Wallet sign error:', error)
      alert('Wallet authentication error')
    }
  }

  const resetState = () => {
    setAuthMethod(null)
    setWalletAddress('')
    setWalletMessage('')
    setIsConnecting(false)
    setIsGitHubLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white border border-gray-200 rounded-lg shadow-xl p-8 max-w-md w-full mx-4 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-xl"
        >
          ×
        </button>

        <h2 className="text-xl font-medium text-gray-900 mb-6">Connect Account</h2>

        {authMethod === null ? (
          <div className="space-y-3">
            {/* GitHub Button */}
            <button
              onClick={handleGitHubAuth}
              disabled={isGitHubLoading}
              className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGitHubLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              )}
              {isGitHubLoading ? 'Redirecting...' : 'Continue with GitHub'}
            </button>

            {/* Wallet Button */}
            <button
              onClick={handleWalletConnect}
              disabled={isConnecting}
              className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              )}
              {isConnecting ? 'Connecting...' : 'Connect Web3 Wallet'}
            </button>
          </div>
        ) : authMethod === 'wallet' && walletMessage ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Sign this message with your wallet to authenticate:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs font-mono text-gray-700 break-all">
              {walletMessage}
            </div>
            <button
              onClick={handleWalletSign}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Sign & Connect
            </button>
            <button
              onClick={resetState}
              className="w-full px-6 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back
            </button>
          </div>
        ) : authMethod === 'github-error' ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                GitHub OAuth is not configured yet.
              </p>
              <p className="text-xs text-gray-400">
                Authentication is optional - you can use AkhAI without an account.
              </p>
            </div>
            <button
              onClick={resetState}
              className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Continue without account
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
