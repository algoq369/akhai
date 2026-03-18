'use client'

import { useState, useEffect } from 'react'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider } from 'ethers'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type AuthStep = 'select' | 'email-input' | 'email-verify' | 'wallet-select' | 'wallet-sign'

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>('select')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [walletMessage, setWalletMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { open: openWalletModal } = useAppKit()
  const { address: appKitAddress, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')

  useEffect(() => {
    if (isConnected && appKitAddress && step === 'wallet-select') {
      handleWalletSelected(appKitAddress)
    }
  }, [isConnected, appKitAddress, step])

  if (!isOpen) return null

  const reset = () => {
    setStep('select'); setEmail(''); setCode('')
    setWalletAddress(''); setWalletMessage('')
    setIsLoading(false); setError('')
  }

  const handleEmailSubmit = async () => {
    if (!email || isLoading) return
    setIsLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, action: 'send' }) })
      const data = await res.json()
      data.success ? setStep('email-verify') : setError(data.error || 'Failed to send code')
    } catch { setError('Network error') } finally { setIsLoading(false) }
  }

  const handleEmailVerify = async () => {
    if (!code || isLoading) return
    setIsLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, action: 'verify' }) })
      const data = await res.json()
      if (data.success) { window.dispatchEvent(new CustomEvent('akhai:auth-success')); onSuccess(); onClose() }
      else setError(data.error || 'Invalid code')
    } catch { setError('Network error') } finally { setIsLoading(false) }
  }

  const handleXAuth = async () => {
    setIsLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/x')
      const data = await res.json()
      data.authUrl ? (window.location.href = data.authUrl) : setError(data.message || 'X auth not configured')
    } catch { setError('X auth unavailable') } finally { setIsLoading(false) }
  }

  const handleWalletSelected = async (address: string) => {
    setIsLoading(true); setError(''); setWalletAddress(address)
    try {
      const res = await fetch('/api/auth/wallet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address }) })
      const data = await res.json()
      setWalletMessage(data.message); setStep('wallet-sign')
    } catch { setError('Failed to get signature message') } finally { setIsLoading(false) }
  }

  const handleWalletSign = async () => {
    setIsLoading(true); setError('')
    try {
      if (!walletProvider) throw new Error('No wallet provider')
      const signer = await new BrowserProvider(walletProvider as any).getSigner()
      const signature = await signer.signMessage(walletMessage)
      const res = await fetch('/api/auth/wallet/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: walletAddress, signature, message: walletMessage }) })
      const data = await res.json()
      if (data.success) {
        import('@/lib/analytics').then(({ trackWalletConnected }) => trackWalletConnected(walletAddress))
        window.dispatchEvent(new CustomEvent('akhai:auth-success')); onSuccess(); onClose()
      } else setError(data.error || 'Verification failed')
    } catch (err: any) {
      setError(err?.code === 4001 || err?.message?.includes('rejected') ? 'Signature rejected' : err?.message || 'Signing failed')
    } finally { setIsLoading(false) }
  }

  const handleGitHubAuth = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/github')
      const data = await res.json()
      data.authUrl ? (window.location.href = data.authUrl) : setError('GitHub OAuth not configured')
    } catch { setError('GitHub auth unavailable') } finally { setIsLoading(false) }
  }

  const S = () => <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin opacity-60" />

  // ── shared btn styles ──
  const btn = "w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded text-[10px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center gap-2.5 disabled:opacity-40"
  const primaryBtn = "w-full px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded text-[10px] hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl p-4 w-[280px] z-10 font-mono">

        {/* close */}
        <button onClick={() => { reset(); onClose() }} className="absolute top-2.5 right-3 text-gray-400 hover:text-gray-600 text-[10px]">✕</button>

        {/* SELECT */}
        {step === 'select' && (
          <>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-3">connect to akhai</p>
            <div className="space-y-1.5">
              <button onClick={() => setStep('email-input')} className={btn}>
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                email
              </button>
              <button onClick={handleXAuth} disabled={isLoading} className={btn}>
                {isLoading ? <S /> : <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
                x / twitter
              </button>
              <button onClick={() => { setStep('wallet-select'); openWalletModal() }} disabled={isLoading} className={btn}>
                {isLoading ? <S /> : <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>}
                web3 wallet
              </button>
              <button onClick={handleGitHubAuth} disabled={isLoading} className={btn}>
                {isLoading ? <S /> : <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>}
                github
              </button>
            </div>
            {error && <p className="text-[9px] text-red-400 mt-2 text-center">{error}</p>}
            <p className="text-[8px] text-gray-400 dark:text-gray-600 text-center mt-3">optional — akhai works without an account</p>
          </>
        )}

        {/* EMAIL INPUT */}
        {step === 'email-input' && (
          <>
            <button onClick={reset} className="text-[9px] text-gray-400 hover:text-gray-600 mb-2.5">← back</button>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-2.5">enter email</p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()} placeholder="you@example.com" autoFocus
              className="w-full px-2.5 py-2 border border-gray-200 dark:border-gray-700 rounded text-[10px] bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-gray-400 font-mono mb-2" />
            <button onClick={handleEmailSubmit} disabled={!email || isLoading} className={primaryBtn}>
              {isLoading && <S />}{isLoading ? 'sending...' : 'send code'}
            </button>
            {error && <p className="text-[9px] text-red-400 mt-2 text-center">{error}</p>}
          </>
        )}

        {/* EMAIL VERIFY */}
        {step === 'email-verify' && (
          <>
            <button onClick={() => setStep('email-input')} className="text-[9px] text-gray-400 hover:text-gray-600 mb-2.5">← back</button>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">check email</p>
            <p className="text-[9px] text-gray-400 mb-2.5">code sent to {email}</p>
            <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={e => e.key === 'Enter' && handleEmailVerify()} placeholder="000000" autoFocus maxLength={6}
              className="w-full px-2.5 py-2 border border-gray-200 dark:border-gray-700 rounded text-center text-base tracking-[0.4em] bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-300 focus:outline-none focus:border-gray-400 font-mono mb-2" />
            <button onClick={handleEmailVerify} disabled={code.length !== 6 || isLoading} className={primaryBtn}>
              {isLoading && <S />}{isLoading ? 'verifying...' : 'verify & connect'}
            </button>
            {error && <p className="text-[9px] text-red-400 mt-2 text-center">{error}</p>}
          </>
        )}

        {/* WALLET SELECT */}
        {step === 'wallet-select' && (
          <>
            <button onClick={reset} className="text-[9px] text-gray-400 hover:text-gray-600 mb-2.5">← back</button>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">connect wallet</p>
            <p className="text-[9px] text-gray-400 mb-3">select a wallet from the modal</p>
            <div className="flex items-center gap-2 py-3 justify-center">
              <div className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[9px] text-gray-400">waiting...</span>
            </div>
            <button onClick={() => openWalletModal()} className={btn + ' justify-center'}>reopen selector</button>
            {error && <p className="text-[9px] text-red-400 mt-2 text-center">{error}</p>}
          </>
        )}

        {/* WALLET SIGN */}
        {step === 'wallet-sign' && (
          <>
            <button onClick={reset} className="text-[9px] text-gray-400 hover:text-gray-600 mb-2.5">← back</button>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">sign message</p>
            <p className="text-[9px] text-gray-500 mb-2">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded p-2 text-[9px] text-gray-500 dark:text-gray-400 break-all mb-2.5 max-h-16 overflow-y-auto leading-relaxed">
              {walletMessage}
            </div>
            <button onClick={handleWalletSign} disabled={isLoading} className={primaryBtn}>
              {isLoading && <S />}{isLoading ? 'signing...' : 'sign & connect'}
            </button>
            {error && <p className="text-[9px] text-red-400 mt-2 text-center">{error}</p>}
          </>
        )}

      </div>
    </div>
  )
}
