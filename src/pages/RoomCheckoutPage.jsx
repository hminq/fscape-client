import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CreditCard, Landmark, Loader2, Wallet } from "lucide-react";
import AppNavbar from "@/components/layout/AppNavbar";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { api } from "@/lib/api";
import defaultRoomImg from "@/assets/default_room_img.jpg";

const STEPS = [
  { id: 1, label: "Thông tin đặt phòng" },
  { id: 2, label: "Điều khoản" },
  { id: 3, label: "Thanh toán" },
];

const moneyFormatter = new Intl.NumberFormat("vi-VN");

function formatVnd(value) {
  if (value == null || Number.isNaN(Number(value))) return "Liên hệ";
  return `${moneyFormatter.format(Number(value))}đ`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return "-";
  return `${day}/${month}/${year.slice(-2)}`;
}

function RoomCheckoutContent() {
  const { buildingId, roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkInDate = searchParams.get("checkInDate") || "";
  const rentalTerm = searchParams.get("term") || "";
  const token = localStorage.getItem("token");

  const [room, setRoom] = useState(null);
  const [roomType, setRoomType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [form, setForm] = useState(() => {
    let user = {};
    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }
    return {
      email: user.email || "",
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      gender: user.gender || "",
      dateOfBirth: "",
      permanentAddress: user.permanent_address || "",
      emergencyContactName: user.emergency_contact_name || "",
      emergencyContactPhone: user.emergency_contact_phone || "",
    };
  });

  useEffect(() => {
    if (token) return;
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?returnTo=${returnTo}`;
  }, [token]);

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
        setError(err.message || "Không thể tải thông tin đặt phòng.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchRoom();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  const roomImage = useMemo(
    () => room?.thumbnail_url || room?.images?.[0]?.image_url || defaultRoomImg,
    [room]
  );

  const termLabel = rentalTerm === "unlimited" ? "Không giới hạn" : rentalTerm ? `${rentalTerm} tháng` : "-";
  const depositLabel = useMemo(() => {
    const base = Number(roomType?.base_price || room?.room_type?.base_price || 0);
    if (!rentalTerm || !base) return "-";
    if (rentalTerm === "unlimited") return `${formatVnd(base)}/1 tháng`;
    return `${formatVnd(base * Number(rentalTerm))}/${rentalTerm} tháng`;
  }, [rentalTerm, roomType, room]);

  const canStepNext = true;

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => Math.min(3, prev + 1));
      return;
    }
    const method = paymentMethod || "VISA / Mastercard";
    navigate(
      `/buildings/${buildingId}/rooms/${roomId}/payment?checkInDate=${checkInDate}&term=${rentalTerm}&method=${encodeURIComponent(
        method
      )}`
    );
  };

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
          to={`/buildings/${buildingId}/rooms/${roomId}/booking`}
          className="rounded-full border border-primary/50 px-6 py-2 text-sm font-semibold text-primary"
        >
          Quay lại
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-12">
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_380px]">
        <div>
          <div className="mb-6 flex items-center gap-3">
            {STEPS.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className={`h-8 min-w-8 rounded-full px-3 text-center text-sm font-semibold leading-8 ${
                    item.id <= step ? "bg-primary text-white" : "bg-primary/10 text-secondary"
                  }`}
                >
                  {item.id}
                </div>
                <p className={`text-sm font-semibold ${item.id <= step ? "text-primary" : "text-secondary"}`}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <h1 className="text-5xl font-bold uppercase text-primary">Hoàn tất đặt phòng</h1>

          {step === 1 && (
            <div className="mt-8 rounded-3xl border border-muted/20 bg-white p-6">
              <h2 className="text-2xl font-bold text-primary">Bước 1: Điền thông tin</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  { key: "email", label: "Email", type: "email" },
                  { key: "firstName", label: "Tên", type: "text" },
                  { key: "lastName", label: "Họ", type: "text" },
                  { key: "gender", label: "Giới tính", type: "text" },
                  { key: "dateOfBirth", label: "Ngày sinh", type: "date" },
                  { key: "permanentAddress", label: "Địa chỉ thường trú", type: "text" },
                  { key: "emergencyContactName", label: "Tên liên hệ khẩn cấp", type: "text" },
                  { key: "emergencyContactPhone", label: "SĐT khẩn cấp", type: "text" },
                ].map((field) => (
                  <input
                    key={field.key}
                    type={field.type}
                    placeholder={field.label}
                    value={form[field.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="h-11 rounded-xl border border-muted/30 px-4 text-sm text-primary outline-none focus:border-olive"
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 rounded-3xl border border-muted/20 bg-white p-6">
              <h2 className="text-2xl font-bold text-primary">Bước 2: Điều khoản</h2>
              <p className="mt-3 text-secondary">
                Đây là dữ liệu demo: bạn xác nhận đồng ý với điều khoản lưu trú, thanh toán và hoàn cọc theo quy định của tòa nhà.
              </p>
              <label className="mt-5 flex items-center gap-2 text-primary">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                Tôi đồng ý với điều khoản và điều kiện
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="mt-8 rounded-3xl border border-muted/20 bg-white p-6">
              <h2 className="text-2xl font-bold text-primary">Bước 3: Thanh toán</h2>
              <p className="mt-3 text-secondary">Chọn phương thức thanh toán (demo).</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: "VISA / Mastercard", icon: CreditCard },
                  { label: "VNPay", icon: Wallet },
                  { label: "Chuyển khoản ngân hàng", icon: Landmark },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setPaymentMethod(item.label)}
                    className={`h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${
                      paymentMethod === item.label
                        ? "border-primary bg-primary text-white"
                        : "border-muted/30 text-secondary hover:border-primary/40"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              disabled={step === 1}
              className={`h-11 rounded-full px-6 text-sm font-semibold ${
                step === 1 ? "bg-muted/30 text-secondary/50" : "bg-primary/10 text-primary"
              }`}
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canStepNext}
              className={`h-11 rounded-full px-6 text-sm font-semibold ${
                !canStepNext ? "bg-muted/30 text-secondary/50" : "bg-primary text-white"
              }`}
            >
              {step === 3 ? "Thanh toán" : "Tiếp tục"}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <aside className="h-fit rounded-3xl border border-muted/20 bg-white p-4">
            <img
              src={roomImage}
              alt={roomType?.name || room.room_number}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultRoomImg;
              }}
              className="h-56 w-full rounded-2xl object-cover"
            />
            <h3 className="mt-4 text-3xl font-bold text-primary">{roomType?.name || "Phòng"}</h3>
            <p className="text-secondary">
              {room.room_number ? `Phòng ${room.room_number}` : "Phòng"} · {room.building?.name}
            </p>
            <div className="mt-4 space-y-2 text-sm text-secondary">
              <p>
                <span className="font-semibold text-primary">Giá phòng:</span>{" "}
                {formatVnd(roomType?.base_price || room?.room_type?.base_price)}/tháng
              </p>
              <p>
                <span className="font-semibold text-primary">Ngày nhận phòng:</span> {formatDisplayDate(checkInDate)}
              </p>
              <p>
                <span className="font-semibold text-primary">Thời gian thuê:</span> {termLabel}
              </p>
              <p>
                <span className="font-semibold text-primary">Cọc dự kiến:</span> {depositLabel}
              </p>
            </div>
          </aside>

          {step >= 2 && (
            <aside className="h-fit rounded-3xl border border-muted/20 bg-white p-5">
              <h4 className="text-xl font-bold text-primary">Thông tin khách hàng</h4>
              <div className="mt-3 space-y-2 text-sm text-secondary">
                <p>
                  <span className="font-semibold text-primary">Email:</span> {form.email || "-"}
                </p>
                <p>
                  <span className="font-semibold text-primary">Họ tên:</span>{" "}
                  {[form.firstName, form.lastName].filter(Boolean).join(" ") || "-"}
                </p>
                <p>
                  <span className="font-semibold text-primary">Giới tính:</span> {form.gender || "-"}
                </p>
                <p>
                  <span className="font-semibold text-primary">Ngày sinh:</span> {form.dateOfBirth || "-"}
                </p>
                <p>
                  <span className="font-semibold text-primary">Địa chỉ:</span> {form.permanentAddress || "-"}
                </p>
                <p>
                  <span className="font-semibold text-primary">Liên hệ khẩn cấp:</span>{" "}
                  {form.emergencyContactName || "-"} ({form.emergencyContactPhone || "-"})
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}

export default function RoomCheckoutPage() {
  return (
    <LocationsProvider>
      <div className="min-h-screen bg-white">
        <AppNavbar />
        <RoomCheckoutContent />
      </div>
    </LocationsProvider>
  );
}
