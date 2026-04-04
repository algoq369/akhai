'use client';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  pay_currency: string | null;
  status: string;
  created_at: number;
  payment_type: 'crypto' | 'stripe' | 'btcpay';
}

interface TransactionsTabProps {
  transactions: Transaction[];
  formatDate: (timestamp: number) => string;
  getStatusColor: (status: string) => string;
}

export default function TransactionsTab({
  transactions,
  formatDate,
  getStatusColor,
}: TransactionsTabProps) {
  return (
    <div>
      {transactions.length === 0 ? (
        <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-8 text-center">
          <div className="text-[9px] text-relic-silver dark:text-relic-ghost uppercase tracking-wider mb-2">
            no transactions yet
          </div>
          <p className="text-[9px] text-relic-mist dark:text-relic-slate">
            your payment history will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4 hover:border-relic-slate dark:hover:border-relic-ghost transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-mono text-relic-slate dark:text-relic-ghost">
                    {tx.payment_type === 'crypto' && '₿'}
                    {tx.payment_type === 'btcpay' && '⚡'}
                    {tx.payment_type === 'stripe' && '💳'}
                    <span className="ml-2">{tx.payment_type.toUpperCase()}</span>
                  </div>
                  <div className={`px-2 py-1 text-[9px] font-mono ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-relic-slate dark:text-relic-ghost">
                    {tx.amount} {tx.currency}
                  </div>
                  {tx.pay_currency && (
                    <div className="text-[9px] text-relic-silver dark:text-relic-ghost mt-0.5">
                      via {tx.pay_currency}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] text-relic-silver dark:text-relic-ghost">
                <div className="font-mono">{tx.id}</div>
                <div>{formatDate(tx.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
