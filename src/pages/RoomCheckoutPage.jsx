import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CircleNotch } from "@phosphor-icons/react";
import AppNavbar from "@/components/layout/AppNavbar";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { api } from "@/lib/api";
import { formatVnd, formatDisplayDate } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import defaultRoomImg from "@/assets/default_room_img.jpg";

const STEPS = [
  { id: 1, label: "Thông tin đặt phòng" },
  { id: 2, label: "Điều khoản" },
];

function RoomCheckoutContent() {
  const { buildingId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const checkInDate = searchParams.get("checkInDate") || "";
  const rentalTerm = searchParams.get("term") || "";
  const billingCycle = searchParams.get("billingCycle") || "";
  const { token, user: authUser } = useAuth();

  const [room, setRoom] = useState(null);
  const [roomType, setRoomType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState(() => {
    const u = authUser || {};
    return {
      email: u.email || "",
      firstName: u.first_name || "",
      lastName: u.last_name || "",
      gender: u.gender || "",
      dateOfBirth: "",
      permanentAddress: u.permanent_address || "",
      emergencyContactName: u.emergency_contact_name || "",
      emergencyContactPhone: u.emergency_contact_phone || "",
    };
  });

  useEffect(() => {
    if (token) return;
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?returnTo=${returnTo}`;
  }, [token]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        // Fetch room + profile in parallel
        const [roomRes, profileRes] = await Promise.all([
          api.get(`/api/rooms/${roomId}`),
          api.get("/api/user-profile/me").catch(() => null),
        ]);

        if (!mounted) return;

        const roomData = roomRes?.data || null;
        if (!roomData) {
          setError("Không tìm thấy thông tin phòng.");
          return;
        }
        setRoom(roomData);

        // Pre-fill form with profile data
        const profile = profileRes?.data?.profile;
        if (profile) {
          setForm((prev) => ({
            ...prev,
            gender: profile.gender || prev.gender,
            dateOfBirth: profile.date_of_birth || prev.dateOfBirth,
            permanentAddress: profile.permanent_address || prev.permanentAddress,
            emergencyContactName: profile.emergency_contact_name || prev.emergencyContactName,
            emergencyContactPhone: profile.emergency_contact_phone || prev.emergencyContactPhone,
          }));
        }

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
    fetchData();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  const roomImage = useMemo(
    () => room?.thumbnail_url || room?.images?.[0]?.image_url || defaultRoomImg,
    [room]
  );

  const BILLING_CYCLE_LABELS = {
    CYCLE_1M: "Hàng tháng",
    CYCLE_3M: "3 tháng",
    CYCLE_6M: "6 tháng",
    ALL_IN: "Trả trọn gói",
  };

  const termLabel = rentalTerm ? `${rentalTerm} tháng` : "-";
  const billingCycleLabel = BILLING_CYCLE_LABELS[billingCycle] || "-";
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = "Email là bắt buộc";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Email không hợp lệ";

    if (!form.firstName) newErrors.firstName = "Tên là bắt buộc";
    if (!form.lastName) newErrors.lastName = "Họ là bắt buộc";
    if (!form.gender) newErrors.gender = "Vui lòng chọn giới tính";
    if (!form.dateOfBirth) newErrors.dateOfBirth = "Ngày sinh là bắt buộc";
    if (!form.permanentAddress) newErrors.permanentAddress = "Địa chỉ là bắt buộc";
    if (!form.emergencyContactName) newErrors.emergencyContactName = "Tên liên hệ khẩn cấp là bắt buộc";
    if (!form.emergencyContactPhone) newErrors.emergencyContactPhone = "SĐT khẩn cấp là bắt buộc";
    else if (!/^\d{10,11}$/.test(form.emergencyContactPhone)) newErrors.emergencyContactPhone = "SĐT phải từ 10-11 số";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }

    // Step 2: đồng ý điều khoản → tạo booking → gọi VNPAY → redirect
    if (!agreed) {
      alert("Bạn cần đồng ý với điều khoản để tiếp tục.");
      return;
    }

    try {
      setSubmitting(true);

      // Tạo booking (PENDING) + lấy URL thanh toán VNPAY trong 1 request
      const res = await api.post("/api/bookings", {
        roomId,
        checkInDate,
        durationMonths: Number(rentalTerm),
        billingCycle,
        customerInfo: form,
      });

      const paymentUrl = res?.data?.payment_url;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("Không nhận được liên kết thanh toán từ máy chủ.");
      }
    } catch (err) {
      alert(err.message || "Không thể khởi tạo thanh toán.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <CircleNotch className="h-10 w-10 animate-spin text-primary" />
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
                  className={`h-8 min-w-8 rounded-full px-3 text-center text-sm font-semibold leading-8 ${item.id <= step ? "bg-primary text-white" : "bg-primary/10 text-secondary"
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
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  { key: "email", label: "Email", type: "email" },
                  { key: "firstName", label: "Tên", type: "text" },
                  { key: "lastName", label: "Họ", type: "text" },
                  { key: "gender", label: "Giới tính", type: "select", options: ["MALE", "FEMALE", "OTHER"] },
                  { key: "dateOfBirth", label: "Ngày sinh", type: "date" },
                  { key: "permanentAddress", label: "Địa chỉ thường trú", type: "text" },
                  { key: "emergencyContactName", label: "Tên liên hệ khẩn cấp", type: "text" },
                  { key: "emergencyContactPhone", label: "SĐT khẩn cấp", type: "text" },
                ].map((field) => (
                  <div key={field.key} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-secondary uppercase tracking-wider ml-1">
                      {field.label}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={form[field.key]}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, [field.key]: e.target.value }));
                          if (errors[field.key]) setErrors(prev => ({ ...prev, [field.key]: "" }));
                        }}
                        className={`h-11 rounded-xl border px-4 text-sm text-primary outline-none focus:border-olive bg-white ${errors[field.key] ? "border-red-500" : "border-muted/30"}`}
                      >
                        <option value="">Chọn {field.label}</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt === "MALE" ? "Nam" : opt === "FEMALE" ? "Nữ" : "Khác"}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.label}
                        value={form[field.key]}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, [field.key]: e.target.value }));
                          if (errors[field.key]) setErrors(prev => ({ ...prev, [field.key]: "" }));
                        }}
                        className={`h-11 rounded-xl border px-4 text-sm text-primary outline-none focus:border-olive ${errors[field.key] ? "border-red-500" : "border-muted/30"}`}
                      />
                    )}
                    {errors[field.key] && (
                      <span className="text-[10px] text-red-500 ml-1 font-medium">{errors[field.key]}</span>
                    )}
                  </div>
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

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              disabled={step === 1}
              className={`h-11 rounded-full px-6 text-sm font-semibold ${step === 1 ? "bg-muted/30 text-secondary/50" : "bg-primary/10 text-primary"
                }`}
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting || (step === 2 && !agreed)}
              className={`h-11 rounded-full px-6 text-sm font-semibold flex items-center gap-2 transition-all ${submitting || (step === 2 && !agreed)
                ? "bg-muted/30 text-secondary/50 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary/90"
                }`}
            >
              {submitting && <CircleNotch className="h-4 w-4 animate-spin" />}
              {step === 2 ? "Thanh toán qua VNPay" : "Tiếp tục"}
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
                <span className="font-semibold text-primary">Chu kỳ thanh toán:</span> {billingCycleLabel}
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
    </section >
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
