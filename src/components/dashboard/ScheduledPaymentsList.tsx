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
    <div className="scheduledPayments-container w-full h-[326px] px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)] overflow-y-scroll">
      <div className="flex items-center justify-between mb-4!">
        <h3 className="scheduledPayments-text text-xs sm:text-sm text-[var(--ink-soft)] tracking-widest font-semibold uppercase flex items-center gap-2.5">
          <span className='text-[var(--gold)]'>—</span>
          Scheduled · Next 7 Days
        </h3>
      </div>

      <div className="scheduledPayments-paymentsList-container w-full h-fit space-y-3!">
        {payments.map((payment) => {
          const Icon = getTypeIcon(payment.type);
          return (
            <div key={payment.id} className="w-full h-fit bg-[var(--bg-subtle)] flex items-center gap-3 px-3! rounded-lg hover:bg-opacity-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <Clock className="w-4 h-4 flex-shrink-0 text-[var(--mute)]" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[var(--ink)] mb-0.5!">
                    {payment.name}
                  </div>
                  <div className="text-xs text-[var(--mute)]">
                    {payment.date}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm text-[var(--ink)]">
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
