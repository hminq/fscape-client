import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CircleNotch, ArrowLeft, CalendarDots, Receipt, CreditCard } from "@phosphor-icons/react";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatVnd, formatDisplayDate } from "@/lib/formatters";

const STATUS_CONFIG = {
  UNPAID: { text: "Chưa thanh toán", className: "bg-amber-100 text-amber-700" },
  PAID: { text: "Đã thanh toán", className: "bg-green-100 text-green-700" },
  OVERDUE: { text: "Quá hạn", className: "bg-red-100 text-red-600" },
  CANCELLED: { text: "Đã hủy", className: "bg-gray-100 text-gray-500" },
};

const BILLING_CYCLE_LABELS = {
  CYCLE_1M: "Hàng tháng",
  CYCLE_3M: "3 tháng",
  CYCLE_6M: "6 tháng",
  ALL_IN: "Trả trọn gói",
};

function MyInvoicesContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("invoiceId");
  const { isLoggedIn } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const fetchInvoices = async () => {
      try {
        const res = await api.get("/api/invoices/my");
        setInvoices(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [isLoggedIn, navigate]);

  // Auto-scroll to highlighted invoice
  useEffect(() => {
    if (!highlightId || loading) return;
    const el = document.getElementById(`invoice-${highlightId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, loading]);

  const handlePay = async (invoiceId) => {
    try {
      setPayingId(invoiceId);
      const res = await api.post("/api/payment/create-invoice-vnpay", { invoiceId });
      const paymentUrl = res?.payment_url || res?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("Không nhận được liên kết thanh toán.");
      }
    } catch (err) {
      alert(err.message || "Không thể tạo thanh toán.");
      setPayingId(null);
    }
  };

  const unpaid = useMemo(
    () => invoices.filter((inv) => inv.status === "UNPAID" || inv.status === "OVERDUE"),
    [invoices]
  );
  const paid = useMemo(
    () => invoices.filter((inv) => inv.status === "PAID"),
    [invoices]
  );
  const cancelled = useMemo(
    () => invoices.filter((inv) => inv.status === "CANCELLED"),
    [invoices]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CircleNotch className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="size-4" />
        Quay lại
      </button>

      <h1 className="text-3xl font-bold text-primary mb-2">Hóa đơn của tôi</h1>
      <p className="text-secondary mb-8">Theo dõi và thanh toán các hóa đơn thuê phòng.</p>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {invoices.length === 0 && !error ? (
        <div className="text-center py-20">
          <p className="text-lg text-secondary mb-4">Bạn chưa có hóa đơn nào.</p>
          <Link
            to="/my-contracts"
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-white"
          >
            Xem hợp đồng
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {unpaid.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-primary mb-4">Cần thanh toán</h2>
              <div className="space-y-4">
                {unpaid.map((inv) => (
                  <InvoiceCard
                    key={inv.id}
                    invoice={inv}
                    highlighted={inv.id === highlightId}
                    onPay={handlePay}
                    paying={payingId === inv.id}
                  />
                ))}
              </div>
            </div>
          )}

          {paid.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-primary mb-4">Đã thanh toán</h2>
              <div className="space-y-4">
                {paid.map((inv) => (
                  <InvoiceCard key={inv.id} invoice={inv} highlighted={inv.id === highlightId} />
                ))}
              </div>
            </div>
          )}

          {cancelled.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-primary mb-4">Đã hủy</h2>
              <div className="space-y-4">
                {cancelled.map((inv) => (
                  <InvoiceCard key={inv.id} invoice={inv} highlighted={inv.id === highlightId} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function InvoiceCard({ invoice, highlighted, onPay, paying }) {
  const statusInfo = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.UNPAID;
  const contract = invoice.contract;
  const room = contract?.room;
  const building = room?.building;
  const canPay = invoice.status === "UNPAID" || invoice.status === "OVERDUE";
  const billingCycleLabel = BILLING_CYCLE_LABELS[contract?.billing_cycle] || "";

  const isOverdue = invoice.status === "OVERDUE" || (
    invoice.status === "UNPAID" && invoice.due_date && new Date(invoice.due_date) < new Date()
  );

  return (
    <div
      id={`invoice-${invoice.id}`}
      className={`rounded-2xl border bg-white p-5 transition-all ${
        highlighted
          ? "border-olive ring-2 ring-olive/20 shadow-md"
          : "border-gray-200 hover:shadow-sm"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left side: invoice info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="size-5 text-primary shrink-0" />
            <h3 className="text-base font-bold text-primary truncate">
              {invoice.invoice_number}
            </h3>
            <span className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
          </div>

          {/* Room & building */}
          {room && (
            <p className="text-sm text-secondary mb-2">
              Phòng {room.room_number} · {building?.name || ""}
              {billingCycleLabel && ` · ${billingCycleLabel}`}
            </p>
          )}

          {/* Billing period & due date */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-secondary">
            <span className="flex items-center gap-1">
              <CalendarDots className="size-3.5 text-olive" />
              Kỳ: {formatDisplayDate(invoice.billing_period_start)} – {formatDisplayDate(invoice.billing_period_end)}
            </span>
            <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-semibold" : ""}`}>
              <CalendarDots className="size-3.5" />
              Hạn: {formatDisplayDate(invoice.due_date)}
              {isOverdue && " (Quá hạn)"}
            </span>
          </div>

          {/* Amount breakdown */}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-secondary border-t border-gray-100 pt-3">
            <span>Tiền thuê: {formatVnd(invoice.room_rent)}</span>
            {Number(invoice.request_fees) > 0 && (
              <span>Phí dịch vụ: {formatVnd(invoice.request_fees)}</span>
            )}
            {Number(invoice.penalty_fees) > 0 && (
              <span className="text-red-500">Phí phạt: {formatVnd(invoice.penalty_fees)}</span>
            )}
          </div>

          {/* Paid date */}
          {invoice.paid_at && (
            <p className="text-xs text-green-600 mt-2">
              Thanh toán lúc: {formatDisplayDate(invoice.paid_at)}
            </p>
          )}
        </div>

        {/* Right side: total + pay button */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-secondary">Tổng cộng</p>
            <p className="text-xl font-bold text-primary">{formatVnd(invoice.total_amount)}</p>
          </div>

          {canPay && onPay && (
            <button
              type="button"
              disabled={paying}
              onClick={() => onPay(invoice.id)}
              className={`flex items-center gap-2 h-10 rounded-full px-6 text-sm font-semibold transition-colors ${
                paying
                  ? "bg-muted/30 text-secondary/50 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {paying ? (
                <CircleNotch className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              Thanh toán
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyInvoicesPage() {
  return (
    <LocationsProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <AppNavbar />
        <div className="flex-1">
          <MyInvoicesContent />
        </div>
        <Footer />
      </div>
    </LocationsProvider>
  );
}
