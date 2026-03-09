import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CircleNotch, ArrowLeft, MapPin, Clock, CalendarDots, Bed, Bathtub, Ruler } from "@phosphor-icons/react";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatVnd, formatDisplayDate } from "@/lib/formatters";
import defaultRoomImg from "@/assets/default_room_img.jpg";

const STATUS_CONFIG = {
  PENDING: { text: "Chờ thanh toán", className: "bg-amber-100 text-amber-700" },
  DEPOSIT_PAID: { text: "Đã đặt cọc", className: "bg-blue-100 text-blue-700" },
  CONVERTED: { text: "Đã tạo hợp đồng", className: "bg-green-100 text-green-700" },
  CANCELLED: { text: "Đã hủy", className: "bg-red-100 text-red-600" },
};

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

function MyBookingsContent() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const fetch = async () => {
      try {
        const res = await api.get("/api/bookings/my");
        setBookings(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isLoggedIn, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CircleNotch className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Separate active/pending bookings from completed/cancelled
  const pending = bookings.filter((b) => b.status === "PENDING" || b.status === "DEPOSIT_PAID");
  const others = bookings.filter((b) => b.status !== "PENDING" && b.status !== "DEPOSIT_PAID");

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="size-4" />
        Quay lại
      </button>

      <h1 className="text-3xl font-bold text-primary mb-2">Đặt phòng của tôi</h1>
      <p className="text-secondary mb-8">Theo dõi trạng thái các đơn đặt phòng của bạn.</p>

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
        <div className="space-y-10">
          {/* Pending / Active bookings */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-primary mb-4">Đang chờ xử lý</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {pending.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            </div>
          )}

          {/* Completed / Cancelled */}
          {others.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-primary mb-4">Lịch sử</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {others.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function BookingCard({ booking }) {
  const room = booking.room;
  const building = room?.building;
  const roomType = room?.room_type;
  const statusInfo = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const isCancelled = booking.status === "CANCELLED";
  const isPending = booking.status === "PENDING";

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-md ${isCancelled ? "border-gray-100 opacity-70" : "border-gray-200"}`}>
      {/* Room image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={room?.thumbnail_url || defaultRoomImg}
          alt={`Phòng ${room?.room_number}`}
          className="h-full w-full object-cover"
        />
        <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
          {statusInfo.text}
        </span>
      </div>

      <div className="p-5">
        {/* Title: RoomType - RoomNumber */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-base font-bold text-primary">
            {roomType?.name ? `${roomType.name} - ${room?.room_number}` : `Phòng ${room?.room_number}`}
          </h3>
          <p className="text-base font-bold text-olive whitespace-nowrap">
            {formatVnd(booking.room_price_snapshot)}
          </p>
        </div>

        {/* Building + floor on same line */}
        {building && (
          <p className="flex items-center gap-1 text-sm text-secondary mb-1">
            <MapPin className="size-3.5 shrink-0" />
            <span>{building.name}</span>
            {room?.floor != null && <span>· Tầng {room.floor}</span>}
          </p>
        )}

        {/* Room type specs */}
        {roomType && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary mb-3">
            {roomType.area_sqm && <span className="flex items-center gap-1"><Ruler className="size-3" />{roomType.area_sqm}m²</span>}
            {roomType.bedrooms && <span className="flex items-center gap-1"><Bed className="size-3" />{roomType.bedrooms} PN</span>}
            {roomType.bathrooms && <span className="flex items-center gap-1"><Bathtub className="size-3" />{roomType.bathrooms} WC</span>}
          </div>
        )}

        {/* Details */}
        <div className="space-y-1.5 text-xs text-secondary border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1.5">
            <CalendarDots className="size-3.5 text-olive" />
            <span>Nhận phòng: {formatDisplayDate(booking.check_in_date)}</span>
            {booking.duration_months && (
              <span className="ml-1">· {booking.duration_months} tháng</span>
            )}
          </div>

          {isPending && booking.expires_at && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-amber-500" />
              <span className="text-amber-600 font-medium">{timeLeft(booking.expires_at)}</span>
            </div>
          )}

          {booking.deposit_paid_at && (
            <div className="flex items-center gap-1.5">
              <span>Đặt cọc: {formatVnd(booking.deposit_amount)} — {formatDisplayDate(booking.deposit_paid_at)}</span>
            </div>
          )}

          {booking.status === "DEPOSIT_PAID" && (
            <p className="text-blue-600 text-xs font-medium mt-1">
              Vui lòng kiểm tra email để ký hợp đồng.
            </p>
          )}

          {isCancelled && booking.cancellation_reason && (
            <p className="text-red-500 text-xs mt-1">
              Lý do: {booking.cancellation_reason}
            </p>
          )}
        </div>

        {/* Booking number */}
        <p className="text-[11px] text-secondary/50 mt-3">{booking.booking_number}</p>
      </div>
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
