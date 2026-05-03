'use client';

interface SynthesisFooterProps {
  responseText: string;
}

export default function SynthesisFooter({ responseText }: SynthesisFooterProps) {
  const match = responseText.match(
    /## SYNTHESIS\s*\n([\s\S]*?)(?=\n##|\n\[RELATED\]|\n\[NEXT\]|$)/i
  );
  const synthesisText = match?.[1]?.trim();

  if (!synthesisText) return null;

  const lines = synthesisText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 5);

  if (lines.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 border-t border-relic-mist/20 dark:border-relic-slate/20">
      <div className="text-[9px] uppercase tracking-[0.25em] text-relic-silver/50 font-mono mb-3">
        synthesis
      </div>
      <div className="space-y-1.5">
        {lines.map((line, i) => (
          <p
            key={i}
            className="text-[12px] leading-relaxed text-relic-slate dark:text-relic-ghost/90 font-mono"
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
