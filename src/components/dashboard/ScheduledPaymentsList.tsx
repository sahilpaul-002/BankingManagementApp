import { Clock, FileText, Users, Repeat } from 'lucide-react';

interface ScheduledPayment {
  id: number;
  name: string;
  type: string;
  date: string;
  amount: number;
  currency: string;
}

interface ScheduledPaymentsListProps {
  payments: ScheduledPayment[];
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'invoice':
      return FileText;
    case 'payroll':
      return Users;
    case 'subscription':
      return Repeat;
    default:
      return Clock;
  }
};

export default function ScheduledPaymentsList({ payments }: ScheduledPaymentsListProps) {
  return (
    <div 
      className="p-5 border"
      style={{ 
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--line)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="text-[10.5px] font-semibold tracking-[0.28em] uppercase flex items-center gap-2.5"
          style={{ color: 'var(--ink-soft)' }}
        >
          <span style={{ color: 'var(--gold)' }}>—</span>
          Scheduled · Next 7 Days
        </h3>
      </div>

      <div className="space-y-3">
        {payments.map((payment) => {
          const Icon = getTypeIcon(payment.type);
          return (
            <div
              key={payment.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-50 cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--bg-subtle)' }}
            >
              <div className="flex items-center gap-3 flex-1">
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--mute)' }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-0.5" style={{ color: 'var(--ink)' }}>
                    {payment.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--mute)' }}>
                    {payment.date}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                  {payment.amount.toLocaleString('en-US', { minimumFractionDigits: 0 })} {payment.currency}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
