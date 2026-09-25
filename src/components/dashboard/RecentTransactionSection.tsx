import { Activity } from 'react';
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, ChevronRight, Clock3, CreditCard, Lock, ReceiptText, RotateCcw, Unlock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomButtonComponent from '../common/CustomButtonComponent';
import type { WalletTransactionItemType, WalletTransactionStatusType, WalletTransactionType, WalletTransactionsListResponseDataType } from '@/types/dashboard/walletTransactionsSectionTypes';
import CustomTooltipComponent from '../common/CustomToolTipComponent';

interface WalletTransactionsPropsType {
  walletTransactions: WalletTransactionsListResponseDataType | [];
  walletTransactionsNotFound?: boolean | undefined;
}

type TransactionVisualConfigType = {
  icon: typeof ArrowDownRight;
  iconBackground: string;
  iconColor: string;
  amountColor: string;
  sign: '+' | '-' | '';
};

type TransactionStatusVisualConfigType = {
  backgroundColor: string;
  color: string;
};

const transactionTypeConfig: Record<WalletTransactionType, TransactionVisualConfigType> = {
  LOAD: {
    icon: ArrowDownRight,
    iconBackground: 'var(--ok-bg)',
    iconColor: 'var(--ok)',
    amountColor: 'var(--ok)',
    sign: '+',
  },

  REFUND: {
    icon: RotateCcw,
    iconBackground: 'var(--ok-bg)',
    iconColor: 'var(--ok)',
    amountColor: 'var(--ok)',
    sign: '+',
  },

  WITHDRAW: {
    icon: ArrowUpRight,
    iconBackground: 'var(--bg-subtle)',
    iconColor: 'var(--ink-soft)',
    amountColor: 'var(--ink)',
    sign: '-',
  },

  TRANSFER: {
    icon: ArrowLeftRight,
    iconBackground: 'var(--bg-subtle)',
    iconColor: 'var(--ink-soft)',
    amountColor: 'var(--ink)',
    sign: '',
  },

  HOLD: {
    icon: Lock,
    iconBackground: 'var(--warn-bg)',
    iconColor: 'var(--warn)',
    amountColor: 'var(--warn)',
    sign: '-',
  },

  RELEASE: {
    icon: Unlock,
    iconBackground: 'var(--ok-bg)',
    iconColor: 'var(--ok)',
    amountColor: 'var(--ok)',
    sign: '+',
  },

  CARD: {
    icon: CreditCard,
    iconBackground: 'var(--bg-subtle)',
    iconColor: 'var(--ink-soft)',
    amountColor: 'var(--ink)',
    sign: '',
  },
};

const transactionStatusConfig: Record<WalletTransactionStatusType, TransactionStatusVisualConfigType> = {
  SUCCESS: {
    backgroundColor: 'var(--ok-bg)',
    color: 'var(--ok)',
  },

  PENDING: {
    backgroundColor: 'var(--warn-bg)',
    color: 'var(--warn)',
  },

  FAILED: {
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger)',
  },

  REVERSED: {
    backgroundColor: 'var(--warn-bg)',
    color: 'var(--warn)',
  },
};

function maskTransactionId(transactionId: string): string {
  if (!transactionId) {
    return '—';
  }

  if (transactionId.length <= 8) {
    return transactionId;
  }

  return `${transactionId.slice(0, 4)}••••${transactionId.slice(-4)}`;
}

function parseDecimal(value: string): number {
  const parsedValue = Number.parseFloat(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatAmount(value: string): string {
  return parseDecimal(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTransactionLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatTransactionDate(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function RecentTransactionsSection({ walletTransactions, walletTransactionsNotFound = false }: WalletTransactionsPropsType) {
  const navigate = useNavigate();

  // Wallet transaction data availability
  const hasWalletTransactions =
    !walletTransactionsNotFound &&
    !Array.isArray(walletTransactions);

  const transactionData = hasWalletTransactions
    ? walletTransactions
    : undefined;

  const transactions = transactionData?.transactions ?? [];

  return (
    <>
      {/* Wallet Transactions Not Found */}
      <Activity mode={hasWalletTransactions ? 'hidden' : 'visible'}>
        <div className="recentTransactions-container w-full h-full px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)] flex flex-col">

          {/* Header */}
          <div className="recentTransactions-texts-container flex items-center justify-between mb-4!">
            <h2 className="text-xs sm:text-sm text-[var(--ink-soft)] tracking-widest font-semibold uppercase">
              Recent Transactions
            </h2>

            <div className="recentTransactions-allTransactions-button-container">
              <CustomButtonComponent
                id="recentTransactions-allTransactions-button"
                label={
                  <>
                    View statements
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                }
                type="button"
                variant="link"
                onClick={() => navigate('/statements')}
              />
            </div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center gap-3 flex-1 py-8!">
            <ReceiptText
              className="w-7 h-7 text-[var(--ink-soft)]"
              strokeWidth={1.5}
            />

            <div className="flex flex-col items-center text-center gap-1">
              <p className="text-sm font-semibold text-[var(--ink)]">
                No transactions found
              </p>

              <p className="text-xs text-[var(--ink-soft)] max-w-[220px] leading-relaxed">
                Recent transactions will appear here once activity is available.
              </p>
            </div>
          </div>
        </div>
      </Activity>

      {/* Wallet Transactions Found */}
      <Activity mode={hasWalletTransactions ? 'visible' : 'hidden'}>
        <div className="recentTransactions-container w-full h-full px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)]">

          {/* Header */}
          <div className="recentTransactions-texts-container flex items-center justify-between mb-4!">
            <h2 className="text-xs sm:text-sm text-[var(--ink-soft)] tracking-widest font-semibold uppercase">
              Recent Transactions
            </h2>

            <div className="recentTransactions-allTransactions-button-container">
              <CustomButtonComponent
                id="recentTransactions-allTransactions-button"
                label={
                  <>
                    View statements
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                }
                type="button"
                variant="link"
                onClick={() => navigate('/statements')}
              />
            </div>
          </div>

          {/* Transaction List */}
          <div className="recentTransactions-transactionList-container space-y-1!">
            {transactions.map((transaction: WalletTransactionItemType) => {
              const typeConfig =
                transactionTypeConfig[transaction.transaction_type];

              const statusConfig =
                transactionStatusConfig[
                transaction.transaction_status
                ];

              const TransactionIcon = typeConfig.icon;

              return (
                <div
                  key={transaction._id}
                  className="recentTransactions-transactionList flex items-center justify-between gap-4 py-2! px-1! rounded-lg transition-colors hover:bg-[var(--bg-subtle)]"
                >
                  {/* Transaction Information */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">

                    {/* Transaction Type Icon */}
                    <div
                      className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor:
                          typeConfig.iconBackground,
                      }}
                    >
                      <TransactionIcon
                        className="w-5 h-5"
                        style={{
                          color: typeConfig.iconColor,
                        }}
                      />
                    </div>

                    {/* Transaction Details */}
                    <div className="flex-1 min-w-0">

                      {/* Transaction Type */}
                      <div
                        className="font-semibold text-xs mb-0.5!"
                        style={{
                          color: typeConfig.iconColor,
                        }}
                      >
                        {formatTransactionLabel(
                          transaction.transaction_type
                        )}
                      </div>

                      {/* Transaction ID */}
                      <div className="text-xs text-[var(--mute)] truncate">
                        <CustomTooltipComponent
                          content={transaction.transaction_id}
                          side="right"
                          align="end"
                          sideOffset={6}
                          contentClassName="bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--line)] shadow-[var(--shadow-sm)] text-[11px]"
                        >
                          <span className="cursor-pointer hover:text-[var(--ink)] transition-colors underline decoration-dotted underline-offset-2">
                            {maskTransactionId(transaction.transaction_id)}
                          </span>
                        </CustomTooltipComponent>
                      </div>

                      {/* Transaction Date */}
                      <div className="text-[10px] text-[var(--mute)] mt-0.5!">
                        {formatTransactionDate(
                          transaction.createdAt
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount / Fee / Status */}
                  <div className="flex items-center gap-4 shrink-0">

                    {/* Amount + Fee */}
                    <div className="text-right">

                      {/* Amount */}
                      <div
                        className="font-semibold text-sm"
                        style={{
                          color: typeConfig.amountColor,
                        }}
                      >
                        {typeConfig.sign}
                        {formatAmount(
                          transaction.amount.$numberDecimal
                        )}

                        <span className="text-xs text-[var(--mute)] font-medium ml-1!">
                          {
                            transaction
                              .wallet_details
                              .wallet_currency
                          }
                        </span>
                      </div>

                      {/* Fee */}
                      <div className="text-[10px] text-[var(--mute)] mt-0.5!">
                        Fee:{' '}
                        {formatAmount(
                          transaction.fee.$numberDecimal
                        )}{' '}
                        {
                          transaction.wallet_details
                            .wallet_currency
                        }
                      </div>
                    </div>

                    {/* Transaction Status */}
                    <span
                      className="inline-flex px-2.5! py-1! rounded-md text-[10px] font-semibold uppercase whitespace-nowrap"
                      style={{
                        backgroundColor:
                          statusConfig.backgroundColor,
                        color: statusConfig.color,
                      }}
                    >
                      {formatTransactionLabel(
                        transaction.transaction_status
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Activity>
    </>
  );
}