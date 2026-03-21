import { useEffect, useRef, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CircleNotch, ArrowLeft, CalendarDots, Receipt, CreditCard, MagnifyingGlass, FunnelSimple, CaretDown, CaretUp, Tag } from "@phosphor-icons/react";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatVnd, formatDisplayDate } from "@/lib/formatters";
import { toast } from "@heroui/react";

const STATUS_CONFIG = {
  UNPAID: { text: "Chưa thanh toán", className: "bg-amber-100 text-amber-700" },
  PAID: { text: "Đã thanh toán", className: "bg-green-100 text-green-700" },
  OVERDUE: { text: "Quá hạn", className: "bg-red-100 text-red-600" },
  CANCELLED: { text: "Đã hủy", className: "bg-gray-100 text-gray-500" },
};

const STATUS_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "unpaid", label: "Cần thanh toán" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const TYPE_FILTERS = [
  { value: "all", label: "Tất cả loại" },
  { value: "RENT", label: "Tiền thuê" },
  { value: "SERVICE", label: "Dịch vụ" },
  { value: "SETTLEMENT", label: "Thanh toán cuối kỳ" },
];

const UNPAID_STATUSES = ["UNPAID", "OVERDUE"];

function FilterDropdown({ options, value, onChange, icon: Icon, placeholder, align = "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const activeLabel = options.find((o) => o.value === value)?.label || placeholder;

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-muted/30 bg-white px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
      >
        {Icon && <Icon className="h-4 w-4" />}
        {activeLabel}
        {open ? <CaretUp className="h-3.5 w-3.5" /> : <CaretDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className={`absolute ${align === "left" ? "left-0" : "right-0"} z-20 mt-2 max-h-64 w-48 overflow-y-auto overflow-x-hidden rounded-xl border border-muted/20 bg-white shadow-lg`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ${
                value === option.value
                  ? "bg-primary text-white font-semibold"
                  : "text-secondary hover:bg-primary/5 hover:text-primary"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MyInvoicesContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("invoiceId");
  const { isLoggedIn } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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
      toast({ title: "Lỗi", description: err.message || "Không thể tạo thanh toán.", color: "danger" });
      setPayingId(null);
    }
  };

  const filtered = useMemo(() => {
    let result = [...invoices];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((inv) => {
        const room = inv.contract?.room;
        const building = room?.building;
        return (
          inv.invoice_number?.toLowerCase().includes(q) ||
          room?.room_number?.toLowerCase().includes(q) ||
          building?.name?.toLowerCase().includes(q)
        );
      });
    }

    // Status filter
    if (statusFilter === "unpaid") {
      result = result.filter((inv) => UNPAID_STATUSES.includes(inv.status));
    } else if (statusFilter !== "all") {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((inv) => inv.invoice_type === typeFilter);
    }

    return result;
  }, [invoices, searchQuery, statusFilter, typeFilter]);

  const unpaidCount = invoices.filter((inv) => UNPAID_STATUSES.includes(inv.status)).length;

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Hóa đơn của tôi</h1>
          <p className="text-secondary text-sm">
            {invoices.length > 0
              ? `${invoices.length} hóa đơn`
              : "Theo dõi và thanh toán các hóa đơn thuê phòng."}
            {unpaidCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                {unpaidCount} cần thanh toán
              </span>
            )}
          </p>
        </div>
      </div>

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
        <>
          {/* Toolbar: Search + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-secondary/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã hóa đơn, phòng, tòa nhà..."
                className="w-full rounded-full border border-muted/30 bg-white py-2 pl-10 pr-4 text-sm text-primary outline-none transition-colors placeholder:text-secondary/40 focus:border-primary hover:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Status filter */}
              <FilterDropdown
                options={STATUS_FILTERS}
                value={statusFilter}
                onChange={setStatusFilter}
                icon={FunnelSimple}
                placeholder="Tất cả"
                align="right"
              />

              {/* Type filter */}
              <FilterDropdown
                options={TYPE_FILTERS}
                value={typeFilter}
                onChange={setTypeFilter}
                icon={Tag}
                placeholder="Tất cả loại"
                align="right"
              />
            </div>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-secondary">Không tìm thấy hóa đơn phù hợp.</p>
              {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
                <button
                  onClick={() => { setSearchQuery(""); setStatusFilter("all"); setTypeFilter("all"); }}
                  className="mt-3 text-sm font-medium text-primary hover:underline"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((inv) => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  highlighted={inv.id === highlightId}
                  onPay={handlePay}
                  paying={payingId === inv.id}
                />
              ))}
            </div>
          )}
        </>
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

  const isOverdue = invoice.status === "OVERDUE" || (
    invoice.status === "UNPAID" && invoice.due_date && new Date(invoice.due_date) < new Date()
  );

  const typeLabel = invoice.invoice_type === "SERVICE"
    ? "Dịch vụ"
    : invoice.invoice_type === "SETTLEMENT"
      ? "Cuối kỳ"
      : "Tiền thuê";

  return (
    <div
      id={`invoice-${invoice.id}`}
      className={`flex flex-col sm:flex-row gap-4 rounded-2xl border bg-white p-5 transition-all ${
        highlighted
          ? "border-olive ring-2 ring-olive/20 shadow-md"
          : canPay
            ? "border-amber-200 bg-amber-50/30 hover:shadow-sm"
            : "border-gray-200 hover:shadow-sm"
      }`}
    >
      {/* Icon */}
      <div className="hidden sm:flex items-center">
        <Receipt className="size-5 text-olive shrink-0" />
      </div>

      {/* Invoice info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-primary truncate">
            {invoice.invoice_number}
          </h3>
          <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {typeLabel}
          </span>
        </div>

        {/* Room & building */}
        {room && (
          <p className="text-xs text-secondary mt-1">
            Phòng {room.room_number} - {building?.name || ""}
          </p>
        )}

        {/* Billing period & due date */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary mt-1">
          <span className="flex items-center gap-1">
            <CalendarDots className="size-3" />
            Kỳ: {formatDisplayDate(invoice.billing_period_start)} – {formatDisplayDate(invoice.billing_period_end)}
          </span>
          <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-semibold" : ""}`}>
            <CalendarDots className="size-3" />
            Hạn: {formatDisplayDate(invoice.due_date)}
            {isOverdue && " (Quá hạn)"}
          </span>
        </div>

        {/* Status badge */}
        <span className={`inline-flex mt-2 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.className}`}>
          {statusInfo.text}
        </span>

        {/* Paid date */}
        {invoice.paid_at && (
          <p className="text-xs text-green-600 mt-1">
            Thanh toán lúc: {formatDisplayDate(invoice.paid_at)}
          </p>
        )}
      </div>

      {/* Right side: total + pay button */}
      <div className="flex flex-col items-end gap-2 shrink-0 sm:ml-auto">
        <div className="text-right">
          <p className="text-[11px] text-secondary">Tổng cộng</p>
          <p className="text-xl font-extrabold text-primary">{formatVnd(invoice.total_amount)}</p>
        </div>

        {canPay && onPay && (
          <button
            type="button"
            disabled={paying}
            onClick={() => onPay(invoice.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
