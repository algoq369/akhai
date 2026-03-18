'use client'

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-relic-white dark:bg-relic-void py-20 px-6">
      <div className="max-w-2xl mx-auto font-mono">
        <Link href="/" className="text-[10px] text-relic-silver hover:text-relic-slate mb-8 block">← back</Link>
        <h1 className="text-2xl font-light text-relic-void dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-[10px] text-relic-silver mb-8">Last updated: March 2026</p>

        <div className="space-y-6 text-sm text-relic-slate dark:text-relic-ghost leading-relaxed">
          <section>
            <h2 className="text-xs uppercase tracking-widest text-relic-silver mb-2">What We Collect</h2>
            <p>AkhAI collects minimal data necessary to provide the service: wallet addresses or GitHub IDs for authentication, queries you submit for processing, and basic usage analytics via PostHog (EU-hosted). We do not use tracking cookies. IP addresses are logged by our hosting infrastructure but not stored by the application.</p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-relic-silver mb-2">How We Use Your Data</h2>
            <p>Your queries are sent to AI providers (Anthropic Claude, DeepSeek, Mistral, xAI) for processing. We do not sell, share, or monetize your data. Query history is stored locally in our database to provide history and conversation features. You can delete your data at any time from your profile settings.</p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-relic-silver mb-2">Third-Party Services</h2>
            <p>We use: Anthropic (AI processing), PostHog (analytics, EU-hosted), Stripe (payments), Brave Search (web search). Each has their own privacy policy. We send only the minimum data required to each service.</p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-relic-silver mb-2">Data Retention</h2>
            <p>Query history is retained until you delete it. Sessions expire after 30 days. You may request complete data deletion by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-relic-silver mb-2">Contact</h2>
            <p>For privacy inquiries: algoq2039@proton.me</p>
          </section>
        </div>
      </div>
    </div>
  )
}
