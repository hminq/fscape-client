import { formatVnd } from "@/lib/formatters";

export default function PaymentSummaryCard({
  title,
  subtitle,
  orderCode,
  amount,
  className = "mb-4",
}) {
  return (
    <div className={`${className} rounded-2xl border border-muted/20 bg-white p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">{title}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-secondary/70">{subtitle}</p>
          )}
          {orderCode && (
            <p className="mt-1 text-xs text-secondary/70">
              Mã đơn: <span className="font-mono font-medium text-primary">{orderCode}</span>
            </p>
          )}
        </div>
        {amount != null && (
          <p className="text-2xl font-bold text-primary">{formatVnd(amount)}</p>
        )}
      </div>
    </div>
  );
}
