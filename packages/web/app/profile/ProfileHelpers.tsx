'use client';

export function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-[9px] font-mono text-relic-silver uppercase tracking-wider mb-2">
        {title}
      </div>
      <div className="text-3xl font-mono text-relic-void mb-1 tracking-tight leading-none">
        {value}
      </div>
      <div className="text-[11px] font-mono text-relic-slate">{subtitle}</div>
    </div>
  );
}

export function ActivityItem({
  action,
  time,
  status,
}: {
  action: string;
  time: string;
  status: 'idle' | 'success' | 'error';
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-relic-silver font-mono text-xs mt-0.5">·</div>
      <div className="flex-1">
        <div className="text-xs font-mono text-relic-void">{action}</div>
        <div className="text-[11px] font-mono text-relic-slate mt-0.5">{time}</div>
      </div>
    </div>
  );
}

export function ActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block border-b border-relic-mist pb-3 hover:border-relic-slate transition-colors"
    >
      <h3 className="text-xs font-mono text-relic-void mb-1.5">{title}</h3>
      <p className="text-[11px] font-mono text-relic-slate leading-relaxed">{description}</p>
    </a>
  );
}
