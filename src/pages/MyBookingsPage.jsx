import { useEffect, useRef, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CircleNotch, ArrowLeft, MapPin, Clock, CalendarDots, Bed, Bathtub, Ruler, PenNib, Eye, X, MagnifyingGlass, FunnelSimple, CaretDown, CaretUp, CalendarCheck, CurrencyCircleDollar, Ticket } from "@phosphor-icons/react";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatVnd, formatDisplayDate } from "@/lib/formatters";

const STATUS_CONFIG = {
  PENDING: { text: "Chờ thanh toán", className: "bg-amber-100 text-amber-700" },
  DEPOSIT_PAID: { text: "Đã đặt cọc", className: "bg-blue-100 text-blue-700" },
  CONVERTED: { text: "Đã tạo hợp đồng", className: "bg-green-100 text-green-700" },
  CANCELLED: { text: "Đã hủy", className: "bg-red-100 text-red-600" },
};

const STATUS_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang xử lý" },
  { value: "CONVERTED", label: "Đã tạo hợp đồng" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const ACTIVE_STATUSES = ["PENDING", "DEPOSIT_PAID"];

function timeLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - Date.now();
  if (diff <= 0) return "Đã hết hạn";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Còn ${mins} phút`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Còn ${hours} giờ`;
  return `Còn ${Math.floor(hours / 24)} ngày`;
}

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

function MyBookingsContent() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailBooking, setDetailBooking] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const fetchBookings = async () => {
      try {
        const res = await api.get("/api/bookings/my");
        setBookings(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [isLoggedIn, navigate]);

  const filtered = useMemo(() => {
    let result = [...bookings];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) => {
        const room = b.room;
        const building = room?.building;
        const roomType = room?.room_type;
        return (
          b.booking_number?.toLowerCase().includes(q) ||
          room?.room_number?.toLowerCase().includes(q) ||
          building?.name?.toLowerCase().includes(q) ||
          roomType?.name?.toLowerCase().includes(q)
        );
      });
    }

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((b) => ACTIVE_STATUSES.includes(b.status));
    } else if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }

    return result;
  }, [bookings, searchQuery, statusFilter]);

  const activeCount = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).length;

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
          <h1 className="text-3xl font-bold text-primary mb-1">Đặt phòng của tôi</h1>
          <p className="text-secondary text-sm">
            {bookings.length > 0
              ? `${bookings.length} đơn đặt phòng`
              : "Theo dõi trạng thái các đơn đặt phòng của bạn."}
            {activeCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                {activeCount} đang xử lý
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

      {bookings.length === 0 && !error ? (
        <div className="text-center py-20">
          <p className="text-lg text-secondary mb-4">Bạn chưa có đơn đặt phòng nào.</p>
          <Link
            to="/rooms"
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-white"
          >
            Tìm phòng ngay
          </Link>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-secondary/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã đặt phòng, phòng, tòa nhà..."
                className="w-full rounded-full border border-muted/30 bg-white py-2 pl-10 pr-4 text-sm text-primary outline-none transition-colors placeholder:text-secondary/40 focus:border-primary hover:border-primary"
              />
            </div>

            <FilterDropdown
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={setStatusFilter}
              icon={FunnelSimple}
              placeholder="Tất cả"
              align="right"
            />
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-secondary">Không tìm thấy đơn đặt phòng phù hợp.</p>
              {(searchQuery || statusFilter !== "all") && (
                <button
                  onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                  className="mt-3 text-sm font-medium text-primary hover:underline"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((b) => (
                <BookingRow key={b.id} booking={b} onDetail={setDetailBooking} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {detailBooking && (
        <BookingDetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} />
      )}
    </section>
  );
}

function BookingRow({ booking, onDetail }) {
  const room = booking.room;
  const building = room?.building;
  const statusInfo = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const isCancelled = booking.status === "CANCELLED";
  const isPending = booking.status === "PENDING";
  const isDepositPaid = booking.status === "DEPOSIT_PAID";

  return (
    <div className={`flex flex-col sm:flex-row gap-4 rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md ${isCancelled ? "border-gray-100 opacity-70" : isPending ? "border-amber-200 bg-amber-50/30" : "border-gray-200"}`}>
      {/* Icon */}
      <div className="hidden sm:flex items-center">
        <Ticket className="size-5 text-olive shrink-0" />
      </div>

      {/* Booking info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-primary truncate">
          {booking.booking_number}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary mt-1">
          {building && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {building.name} - Phòng {room?.room_number}
            </span>
          )}
          <span className="flex items-center gap-1">
            <CalendarDots className="size-3" />
            Nhận phòng: {formatDisplayDate(booking.check_in_date)}
            {booking.duration_months && ` · ${booking.duration_months} tháng`}
          </span>
        </div>

        {/* Expiry countdown for pending */}
        {isPending && booking.expires_at && (
          <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mt-1">
            <Clock className="size-3" />
            {timeLeft(booking.expires_at)}
          </div>
        )}

        {/* Status badge */}
        <span className={`inline-flex mt-2 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.className}`}>
          {statusInfo.text}
        </span>
      </div>

      {/* Right — price + actions */}
      <div className="flex flex-col items-end gap-2 shrink-0 sm:ml-auto">
        <div className="text-right">
          <p className="text-[11px] text-secondary">Giá phòng</p>
          <p className="text-xl font-extrabold text-primary">{formatVnd(booking.room_price_snapshot)}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDetail(booking)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-secondary hover:bg-gray-50 transition-colors"
          >
            <Eye className="size-4" />
            Xem
          </button>
          {isDepositPaid && booking.contract_id && (
            <Link
              to={`/sign?contractId=${booking.contract_id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
            >
              <PenNib className="size-4" />
              Ký hợp đồng
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingDetailModal({ booking, onClose }) {
  const room = booking.room;
  const building = room?.building;
  const roomType = room?.room_type;
  const statusInfo = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const isPending = booking.status === "PENDING";
  const isCancelled = booking.status === "CANCELLED";

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose} />

      <div className="fixed inset-x-4 top-[10%] bottom-auto z-[70] mx-auto max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-bold text-primary text-lg">Chi tiết đặt phòng</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-9 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Status + booking number */}
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
            <span className="text-xs text-secondary/50">{booking.booking_number}</span>
          </div>

          {/* Room info */}
          <div className="rounded-xl bg-gray-50 p-4 space-y-3">
            <h3 className="text-base font-bold text-primary">
              {roomType?.name ? `${roomType.name} - Phòng ${room?.room_number}` : `Phòng ${room?.room_number}`}
            </h3>

            {building && (
              <div className="flex items-center gap-1.5 text-sm text-secondary">
                <MapPin className="size-3.5 text-olive" />
                {building.name}
                {room?.floor != null && <span>· Tầng {room.floor}</span>}
              </div>
            )}

            {roomType && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary">
                {roomType.area_sqm && <span className="flex items-center gap-1"><Ruler className="size-3" />{roomType.area_sqm}m²</span>}
                {roomType.bedrooms && <span className="flex items-center gap-1"><Bed className="size-3" />{roomType.bedrooms} PN</span>}
                {roomType.bathrooms && <span className="flex items-center gap-1"><Bathtub className="size-3" />{roomType.bathrooms} WC</span>}
              </div>
            )}
          </div>

          {/* Booking details */}
          <div className="space-y-3">
            <DetailRow icon={CalendarCheck} label="Nhận phòng" value={formatDisplayDate(booking.check_in_date)} />
            {booking.duration_months && (
              <DetailRow icon={CalendarDots} label="Thời hạn" value={`${booking.duration_months} tháng`} />
            )}
            <DetailRow icon={CurrencyCircleDollar} label="Giá phòng" value={formatVnd(booking.room_price_snapshot)} bold />

            {booking.deposit_amount && (
              <DetailRow
                icon={CurrencyCircleDollar}
                label="Đặt cọc"
                value={`${formatVnd(booking.deposit_amount)}${booking.deposit_paid_at ? ` — ${formatDisplayDate(booking.deposit_paid_at)}` : ""}`}
              />
            )}

            {isPending && booking.expires_at && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="size-4 text-amber-500 shrink-0" />
                <span className="text-secondary">Hết hạn thanh toán</span>
                <span className="ml-auto font-semibold text-amber-600">{timeLeft(booking.expires_at)}</span>
              </div>
            )}

            {isCancelled && booking.cancellation_reason && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                <span className="font-medium">Lý do hủy:</span> {booking.cancellation_reason}
              </div>
            )}
          </div>

          {/* Sign action */}
          {booking.status === "DEPOSIT_PAID" && booking.contract_id && (
            <Link
              to={`/sign?contractId=${booking.contract_id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              <PenNib className="size-4" />
              Ký hợp đồng ngay
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

function DetailRow({ icon, label, value, bold }) {
  const IconComp = icon;
  return (
    <div className="flex items-center gap-3 text-sm">
      <IconComp className="size-4 text-olive shrink-0" />
      <span className="text-secondary">{label}</span>
      <span className={`ml-auto text-right ${bold ? "font-extrabold text-primary" : "font-medium text-primary"}`}>{value}</span>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <LocationsProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <AppNavbar />
        <div className="flex-1">
          <MyBookingsContent />
        </div>
        <Footer />
      </div>
    </LocationsProvider>
  );
}
