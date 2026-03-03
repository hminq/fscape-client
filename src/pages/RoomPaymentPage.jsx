import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import AppNavbar from "@/components/layout/AppNavbar";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { api } from "@/lib/api";
import { formatVnd } from "@/lib/formatters";
import defaultRoomImg from "@/assets/default_room_img.jpg";

function RoomPaymentContent() {
  const { buildingId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";
  const paymentMethod = searchParams.get("method") || "VISA / Mastercard";

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchBooking() {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/api/bookings/${bookingId}`);
        if (!mounted) return;
        setBooking(res?.data || null);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Không thể tải thông tin thanh toán.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchBooking();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  const countdownText = useMemo(() => {
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const s = String(secondsLeft % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xl font-semibold text-primary">{error || "Không tìm thấy đơn đặt phòng hợp lệ."}</p>
        <Link
          to="/"
          className="rounded-full border border-primary/50 px-6 py-2 text-sm font-semibold text-primary"
        >
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const { room } = booking;
  const roomType = room?.room_type;

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-12">
     

      <h1 className="text-5xl font-bold uppercase text-primary">Thanh toán</h1>
      <p className="mt-2 text-secondary">Vui lòng hoàn tất thanh toán tiền cọc để giữ phòng.</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
        <div className="rounded-3xl border border-muted/20 bg-white p-6">
          <h2 className="text-2xl font-bold text-primary">Quét mã QR ngân hàng</h2>
          <p className="mt-2 text-secondary">
            Thời gian giữ đơn hàng còn: <span className="font-semibold text-primary">{countdownText}</span>
          </p>

          <div className="mt-6 flex justify-center">
            <div className="flex h-72 w-72 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/5 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">QR BANK</p>
                <p className="mt-1 text-sm text-secondary">QUÉT ĐỂ THANH TOÁN</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm text-secondary">
            <p>
              <span className="font-semibold text-primary">Ngân hàng:</span> Vietcombank (Demo)
            </p>
            <p>
              <span className="font-semibold text-primary">Chủ tài khoản:</span> CONG TY FSCAPE
            </p>
            <p>
              <span className="font-semibold text-primary">Số tài khoản:</span> 1234567890
            </p>
            <p>
              <span className="font-semibold text-primary">Nội dung CK:</span> {booking.booking_number}
            </p>
            <p>
              <span className="font-semibold text-primary">Số tiền:</span> {formatVnd(booking.deposit_amount)}
            </p>
            <p>
              <span className="font-semibold text-primary">Phương thức:</span> {paymentMethod}
            </p>
          </div>

          {paymentMethod.includes("VNPay") && (
            <div className="mt-8">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await api.post("/api/payments/create-booking-vnpay", {
                      bookingId: booking.id,
                      bankCode: "" // Có thể mở rộng để chọn ngân hàng
                    });
                    if (res?.success && res?.data?.paymentUrl) {
                      window.location.href = res.data.paymentUrl;
                    } else {
                      throw new Error(res?.message || "Không nhận được liên kết thanh toán từ máy chủ.");
                    }
                  } catch (err) {
                    alert(err.message || "Lỗi khởi tạo thanh toán VNPay");
                  }
                }}
                className="w-full h-14 bg-[#005baa] text-white font-bold rounded-2xl hover:bg-[#004a8c] transition-colors flex items-center justify-center gap-3 shadow-lg"
              >
                <img src="https://vnpay.vn/wp-content/uploads/2020/07/Logo-VNPAY-QR.png" alt="VNPay" className="h-6 bg-white p-1 rounded" />
                Thanh toán qua VNPay
              </button>
              <p className="mt-3 text-center text-xs text-secondary">
                Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay
              </p>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-muted/20 bg-white p-4">
          <img
            src={room.thumbnail_url || room.images?.[0]?.image_url || defaultRoomImg}
            alt={roomType?.name || room.room_number}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultRoomImg;
            }}
            className="h-56 w-full rounded-2xl object-cover"
          />
          <h3 className="mt-4 text-3xl font-bold text-primary">{roomType?.name || "Phòng"}</h3>
          <p className="text-secondary">{room.building?.name}</p>
          <div className="mt-4 space-y-2 text-sm text-secondary">
            <p>
              <span className="font-semibold text-primary">Phòng:</span> {room.room_number || "-"}
            </p>
            <p>
              <span className="font-semibold text-primary">Ngày nhận phòng:</span> {booking.check_in_date || "-"}
            </p>
            <p>
              <span className="font-semibold text-primary">Kỳ hạn (Ghi chú):</span> {booking.notes || "-"}
            </p>
            <p>
              <span className="font-semibold text-primary">Tiền cọc:</span> {formatVnd(booking.deposit_amount)}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default function RoomPaymentPage() {
  return (
    <LocationsProvider>
      <div className="min-h-screen bg-white">
        <AppNavbar />
        <RoomPaymentContent />
      </div>
    </LocationsProvider>
  );
}
