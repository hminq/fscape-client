import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AppNavbar from "@/components/layout/AppNavbar";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { api } from "@/lib/api";
import { formatVnd } from "@/lib/formatters";
import defaultRoomImg from "@/assets/default_room_img.jpg";

function RoomPaymentContent() {
  const { buildingId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const checkInDate = searchParams.get("checkInDate") || "";
  const rentalTerm = searchParams.get("term") || "";
  const paymentMethod = searchParams.get("method") || "VISA / Mastercard";

  const [room, setRoom] = useState(null);
  const [roomType, setRoomType] = useState(null);
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
    async function fetchRoom() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/api/rooms/${roomId}`);
        if (!mounted) return;
        const roomData = res?.data || null;
        if (!roomData) {
          setError("Không tìm thấy thông tin phòng.");
          return;
        }
        setRoom(roomData);

        const typeId = roomData?.room_type?.id;
        if (!typeId) {
          setRoomType(roomData.room_type || null);
          return;
        }
        try {
          const typeRes = await api.get(`/api/room-types/${typeId}`);
          if (!mounted) return;
          setRoomType(typeRes?.data || roomData.room_type || null);
        } catch {
          if (!mounted) return;
          setRoomType(roomData.room_type || null);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Không thể tải trang thanh toán.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchRoom();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  const paymentAmount = useMemo(() => {
    const base = Number(roomType?.base_price || room?.room_type?.base_price || 0);
    if (!base) return "-";
    if (rentalTerm === "unlimited") return `${formatVnd(base)}/1 tháng`;
    if (!rentalTerm) return formatVnd(base);
    return `${formatVnd(base * Number(rentalTerm))}/${rentalTerm} tháng`;
  }, [roomType, room, rentalTerm]);

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

  if (error || !room) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xl font-semibold text-primary">{error || "Đã có lỗi xảy ra."}</p>
        <Link
          to={`/buildings/${buildingId}/rooms/${roomId}/checkout?checkInDate=${checkInDate}&term=${rentalTerm}`}
          className="rounded-full border border-primary/50 px-6 py-2 text-sm font-semibold text-primary"
        >
          Quay lại
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-12">
      <h1 className="text-5xl font-bold uppercase text-primary">Thanh toán</h1>
      <p className="mt-2 text-secondary">Trang thanh toán mô phỏng (fake data).</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
        <div className="rounded-3xl border border-muted/20 bg-white p-6">
          <h2 className="text-2xl font-bold text-primary">Quét mã QR ngân hàng</h2>
          <p className="mt-2 text-secondary">Thời gian giữ giao dịch còn: <span className="font-semibold text-primary">{countdownText}</span></p>

          <div className="mt-6 flex justify-center">
            <div className="flex h-72 w-72 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/5 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">QR BANK</p>
                <p className="mt-1 text-sm text-secondary">DEMO PAYMENT</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm text-secondary">
            <p>
              <span className="font-semibold text-primary">Ngân hàng:</span> Vietcombank (demo)
            </p>
            <p>
              <span className="font-semibold text-primary">Số tài khoản:</span> 0123456789
            </p>
            <p>
              <span className="font-semibold text-primary">Nội dung CK:</span> FSCAPE-{roomId.slice(0, 8).toUpperCase()}
            </p>
            <p>
              <span className="font-semibold text-primary">Số tiền:</span> {paymentAmount}
            </p>
            <p>
              <span className="font-semibold text-primary">Phương thức đã chọn:</span> {paymentMethod}
            </p>
          </div>
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
              <span className="font-semibold text-primary">Ngày nhận phòng:</span> {checkInDate || "-"}
            </p>
            <p>
              <span className="font-semibold text-primary">Kỳ hạn:</span>{" "}
              {rentalTerm === "unlimited" ? "Không giới hạn" : rentalTerm ? `${rentalTerm} tháng` : "-"}
            </p>
            <p>
              <span className="font-semibold text-primary">Cần thanh toán:</span> {paymentAmount}
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
