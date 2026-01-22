import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-relic-ghost dark:bg-relic-void p-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <Link
          href="/"
          className="text-xs text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white mb-6 inline-block"
        >
          ← back
        </Link>
        <h1 className="text-2xl font-mono text-relic-slate dark:text-white mb-2">
          Get Help
        </h1>
        <p className="text-xs text-relic-silver dark:text-relic-ghost">
          Resources and support for AkhAI
        </p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Documentation */}
        <section className="bg-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6">
          <h2 className="text-sm font-mono text-relic-slate dark:text-white mb-3 uppercase tracking-wider">
            Documentation
          </h2>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-relic-silver dark:text-relic-ghost mb-1">Official Docs</p>
              <a
                href="https://docs.akhai.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-relic-slate dark:text-white hover:text-relic-void dark:hover:text-relic-ghost transition-colors"
              >
                docs.akhai.ai →
              </a>
            </div>
            <div className="mt-4">
              <Link
                href="/philosophy"
                className="text-xs font-mono text-relic-slate dark:text-white hover:text-relic-void dark:hover:text-relic-ghost transition-colors"
              >
                Philosophy & Architecture →
              </Link>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="bg-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6">
          <h2 className="text-sm font-mono text-relic-slate dark:text-white mb-3 uppercase tracking-wider">
            Support
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-relic-silver dark:text-relic-ghost mb-1">Email</p>
              <a
                href="mailto:support@akhai.ai"
                className="text-xs font-mono text-relic-slate dark:text-white hover:text-relic-void dark:hover:text-relic-ghost transition-colors"
              >
                support@akhai.ai
              </a>
            </div>
            <div>
              <p className="text-xs text-relic-silver dark:text-relic-ghost mb-1">Response time</p>
              <p className="text-xs text-relic-slate dark:text-white">
                Within 24 hours
              </p>
            </div>
          </div>
        </section>

        {/* Community */}
        <section className="bg-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6">
          <h2 className="text-sm font-mono text-relic-slate dark:text-white mb-3 uppercase tracking-wider">
            Community
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-relic-silver dark:text-relic-ghost mb-1">Discord</p>
              <a
                href="https://discord.gg/akhai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-relic-slate dark:text-white hover:text-relic-void dark:hover:text-relic-ghost transition-colors"
              >
                discord.gg/akhai →
              </a>
            </div>
            <div>
              <p className="text-xs text-relic-silver dark:text-relic-ghost mb-1">GitHub</p>
              <a
                href="https://github.com/akhai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-relic-slate dark:text-white hover:text-relic-void dark:hover:text-relic-ghost transition-colors"
              >
                github.com/akhai →
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6">
          <h2 className="text-sm font-mono text-relic-slate dark:text-white mb-4 uppercase tracking-wider">
            FAQ
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-mono text-relic-slate dark:text-white mb-1">
                What are methodologies?
              </h3>
              <p className="text-xs text-relic-silver dark:text-relic-ghost leading-relaxed">
                AkhAI uses 7 reasoning methodologies (Direct, CoD, BoT, ReAct, PoT, GTP, Auto) to process queries with different cognitive strategies.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-mono text-relic-slate dark:text-white mb-1">
                What is the Grounding Guard?
              </h3>
              <p className="text-xs text-relic-silver dark:text-relic-ghost leading-relaxed">
                An anti-hallucination system with 4 detectors (Hype, Echo, Drift, Factuality) that verifies response quality.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-mono text-relic-slate dark:text-white mb-1">
                How do I upgrade my plan?
              </h3>
              <p className="text-xs text-relic-silver dark:text-relic-ghost leading-relaxed">
                Click "upgrade plan" in the profile menu or visit the <Link href="/pricing" className="underline hover:text-relic-slate dark:hover:text-white">pricing page</Link>.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
