import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Bath,
  Camera,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DraftingCompass,
  Landmark,
  Loader2,
  Ruler,
  Users,
  Wallet,
  X,
} from "lucide-react";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { api } from "@/lib/api";
import defaultRoomImg from "@/assets/default_room_img.jpg";

const moneyFormatter = new Intl.NumberFormat("vi-VN");

function formatVnd(value) {
  if (value == null || Number.isNaN(Number(value))) return "Liên hệ";
  return `${moneyFormatter.format(Number(value))}đ`;
}

function RoomDetailContent() {
  const { buildingId, roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [roomType, setRoomType] = useState(null);
  const [buildingLocationName, setBuildingLocationName] = useState("");
  const [buildingFacilities, setBuildingFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewState, setPreviewState] = useState({ mode: null, image: defaultRoomImg });
  const [mainImage, setMainImage] = useState("");
  const [galleryTrack, setGalleryTrack] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchRoomDetail() {
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
        } else {
          try {
            const typeRes = await api.get(`/api/room-types/${typeId}`);
            if (!mounted) return;
            setRoomType(typeRes?.data || roomData.room_type || null);
          } catch {
            if (!mounted) return;
            setRoomType(roomData.room_type || null);
          }
        }

        try {
          const buildingRes = await api.get(`/api/buildings/${buildingId}`);
          if (!mounted) return;
          setBuildingLocationName(buildingRes?.data?.location?.name || "");
          const facilities = (buildingRes?.data?.facilities || [])
            .filter((item) => {
              const relationActive = item?.BuildingFacility?.is_active;
              const facilityActive = item?.is_active;
              return (relationActive ?? true) && (facilityActive ?? true);
            })
            .map((item) => item?.name)
            .filter(Boolean);
          setBuildingFacilities(facilities);
        } catch {
          if (!mounted) return;
          setBuildingLocationName("");
          setBuildingFacilities([]);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Không thể tải chi tiết phòng.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRoomDetail();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  const previewImage = useMemo(
    () => room?.thumbnail_url || room?.images?.[0]?.image_url || defaultRoomImg,
    [room]
  );

  const galleryImages = useMemo(() => {
    const list = [room?.thumbnail_url, ...(room?.images || []).map((img) => img?.image_url)].filter(Boolean);
    if (list.length === 0) return [defaultRoomImg, defaultRoomImg, defaultRoomImg, defaultRoomImg];
    return [...new Set(list)];
  }, [room]);

  useEffect(() => {
    setMainImage(previewImage);
  }, [previewImage]);

  const scrollGallery = (direction) => {
    if (!galleryTrack) return;
    galleryTrack.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
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
          to={`/buildings/${buildingId}/rooms`}
          className="rounded-full border border-primary/50 px-6 py-2 text-sm font-semibold text-primary"
        >
          Quay lại
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-12">
      <div className="mb-4 text-sm text-secondary">
        <span>{buildingLocationName || "Địa điểm"}</span> &gt;{" "}
        <Link to={`/buildings/${buildingId}`} className="hover:text-primary">
          {room.building?.name || "Tòa nhà"}
        </Link>{" "}
        &gt; <span className="text-primary">{roomType?.name || "Loại phòng"}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 className="text-5xl font-bold uppercase leading-[0.95] text-primary md:text-6xl">
            {roomType?.name || "Phòng"}
          </h1>
          <p className="mt-2 text-3xl font-semibold text-secondary">{room.building?.name}</p>
          <p className="mt-1 text-lg text-secondary/80">{room.building?.address || "Đang cập nhật địa chỉ"}</p>

          <div className="mt-8">
            <p className="text-sm text-secondary">Giá từ</p>
            <p className="text-5xl font-bold text-primary">
              {formatVnd(roomType?.base_price || room.room_type?.base_price)}
              <span className="ml-1 text-lg font-medium text-secondary">/tháng</span>
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-xl text-secondary">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5 text-olive" />
              {roomType?.capacity_min ?? "N/A"}-{roomType?.capacity_max ?? "N/A"} người
            </span>
            <span className="flex items-center gap-2">
              <Bath className="h-5 w-5 text-olive" />
              {roomType?.bathrooms ?? "N/A"} phòng tắm
            </span>
            <span className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-olive" />
              {roomType?.area_sqm ?? "N/A"} m²
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/buildings/${buildingId}/rooms/${roomId}/booking`)}
            className="mt-8 h-12 rounded-full bg-olive px-10 text-base font-semibold text-primary transition-colors hover:bg-tea"
          >
            Đặt ngay
          </button>

          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
              Hỗ trợ thanh toán
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1.5 text-sm text-secondary">
                <CreditCard className="h-4 w-4 text-olive" />
                Visa/Mastercard
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1.5 text-sm text-secondary">
                <Wallet className="h-4 w-4 text-olive" />
                VNPay
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1.5 text-sm text-secondary">
                <Landmark className="h-4 w-4 text-olive" />
                Chuyển khoản ngân hàng
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <img
            src={mainImage || previewImage}
            alt={roomType?.name || room.room_number}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultRoomImg;
            }}
            className="h-full min-h-[420px] w-full rounded-2xl object-cover"
          />

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
            <button
              type="button"
              onClick={() => setPreviewState({ mode: "3d", image: defaultRoomImg })}
              className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2 text-sm font-semibold text-muted"
            >
              <Camera className="h-4 w-4 text-olive" />
              Ảnh 3D
            </button>
            <button
              type="button"
              onClick={() => setPreviewState({ mode: "blueprint", image: defaultRoomImg })}
              className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2 text-sm font-semibold text-muted"
            >
              <DraftingCompass className="h-4 w-4 text-olive" />
              Bản vẽ
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-muted/20 pt-8">
        <h2 className="text-2xl font-bold text-primary">Thư viện ảnh</h2>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollGallery("left")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-muted/30 text-secondary hover:bg-primary/5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={setGalleryTrack}
            className="flex w-full gap-3 overflow-x-auto rounded-2xl scrollbar-hide"
          >
            {galleryImages.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() =>
                  setPreviewState({
                    mode: "gallery",
                    image: img || defaultRoomImg,
                  })
                }
                className="min-w-[220px] overflow-hidden rounded-xl border border-muted/20"
              >
                <img
                  src={img || defaultRoomImg}
                  alt={`Room gallery ${idx + 1}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultRoomImg;
                  }}
                  className="h-28 w-full object-cover"
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollGallery("right")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-muted/30 text-secondary hover:bg-primary/5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 border-t border-muted/20 pt-10 md:grid-cols-2">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-wide text-primary">Giới thiệu phòng</h2>
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-secondary">
            {roomType?.description || "Hiện chưa có mô tả chi tiết cho loại phòng này."}
          </p>
        </div>
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-wide text-primary">Tiện ích phòng</h2>
          {buildingFacilities.length === 0 ? (
            <p className="mt-4 text-lg text-secondary">Hiện chưa có tiện ích nổi bật.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-lg text-secondary md:grid-cols-2">
              {buildingFacilities.slice(0, 10).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-olive" />
                  {feature}
                </li>
              ))}
              {buildingFacilities.length > 10 && (
                <li className="flex items-start gap-2 font-semibold text-primary">
                  <span className="mt-1">+</span>
                  {buildingFacilities.length - 10} tiện ích khác
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {previewState.mode && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewState({ mode: null, image: defaultRoomImg })}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-semibold text-primary">
                {previewState.mode === "3d"
                  ? "Ảnh 3D"
                  : previewState.mode === "blueprint"
                    ? "Bản vẽ"
                    : "Thư viện ảnh"}
              </p>
              <button
                type="button"
                onClick={() => setPreviewState({ mode: null, image: defaultRoomImg })}
                className="rounded-full p-1 text-secondary hover:bg-primary/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={previewState.image || defaultRoomImg}
              alt="Preview"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultRoomImg;
              }}
              className="h-[70vh] w-full rounded-xl object-cover"
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default function RoomDetailPage() {
  return (
    <LocationsProvider>
      <div className="min-h-screen bg-white">
        <AppNavbar />
        <RoomDetailContent />
        <Footer />
      </div>
    </LocationsProvider>
  );
}
