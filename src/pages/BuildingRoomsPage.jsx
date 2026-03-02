import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Bath, BedDouble, Loader2, Ruler, Users } from "lucide-react";
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

function BuildingRoomsContent() {
  const { buildingId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTypeIds = useMemo(() => {
    const typeIdsFromList = (searchParams.get("roomTypeIds") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const singleType = searchParams.get("roomTypeId");
    if (typeIdsFromList.length > 0) return typeIdsFromList;
    return singleType ? [singleType] : [];
  }, [searchParams]);

  const [rooms, setRooms] = useState([]);
  const [roomTypeDetails, setRoomTypeDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTypeIds, setSelectedTypeIds] = useState(initialTypeIds);
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    let mounted = true;

    async function fetchRooms() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/api/rooms?building_id=${buildingId}&limit=200`);
        if (!mounted) return;
        const roomList = res?.data || [];
        setRooms(roomList);

        const uniqueTypeIds = [...new Set(roomList.map((room) => room.room_type?.id).filter(Boolean))];
        if (uniqueTypeIds.length === 0) {
          setRoomTypeDetails({});
          return;
        }

        const typeEntries = await Promise.all(
          uniqueTypeIds.map(async (id) => {
            try {
              const detailRes = await api.get(`/api/room-types/${id}`);
              return [id, detailRes?.data || null];
            } catch {
              return [id, null];
            }
          })
        );

        if (!mounted) return;
        const detailMap = typeEntries.reduce((acc, [id, data]) => {
          if (data) acc[id] = data;
          return acc;
        }, {});
        setRoomTypeDetails(detailMap);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Không thể tải danh sách phòng.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRooms();
    return () => {
      mounted = false;
    };
  }, [buildingId]);

  const roomTypeFilters = useMemo(() => {
    const map = new Map();
    rooms.forEach((room) => {
      const type = roomTypeDetails[room.room_type?.id] || room.room_type;
      if (!type?.id) return;
      const prev = map.get(type.id);
      map.set(type.id, {
        id: type.id,
        name: type.name || "Loại phòng",
        count: (prev?.count || 0) + 1,
      });
    });
    return Array.from(map.values());
  }, [rooms, roomTypeDetails]);

  useEffect(() => {
    if (roomTypeFilters.length === 0) return;
    if (selectedTypeIds.length === 0) return;
    const validSet = new Set(roomTypeFilters.map((item) => item.id));
    const next = selectedTypeIds.filter((id) => validSet.has(id));
    if (next.length === selectedTypeIds.length) return;
    setSelectedTypeIds(next);
  }, [selectedTypeIds, roomTypeFilters]);

  useEffect(() => {
    if (initialTypeIds.length === 0) return;
    const validSet = new Set(roomTypeFilters.map((item) => item.id));
    const next = initialTypeIds.filter((id) => validSet.has(id));
    if (next.length === 0) return;
    setSelectedTypeIds(next);
  }, [initialTypeIds, roomTypeFilters]);

  const filteredRooms = useMemo(() => {
    const base =
      selectedTypeIds.length === 0
        ? rooms
        : rooms.filter((room) => selectedTypeIds.includes(room.room_type?.id));

    return [...base].sort((a, b) => {
      const priceA = Number(a.room_type?.base_price || 0);
      const priceB = Number(b.room_type?.base_price || 0);
      return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
    });
  }, [rooms, selectedTypeIds, sortOrder]);

  const handleToggleType = (typeId) => {
    if (typeId === "all") {
      setSelectedTypeIds([]);
      setSearchParams({});
      return;
    }

    setSelectedTypeIds((prev) => {
      const hasType = prev.includes(typeId);
      const next = hasType ? prev.filter((id) => id !== typeId) : [...prev, typeId];
      if (next.length === 0) setSearchParams({});
      else setSearchParams({ roomTypeIds: next.join(",") });
      return next;
    });
  };

  const buildingName = rooms[0]?.building?.name || "Tòa nhà";

  return (
    <div className="min-h-screen bg-white">
      <AppNavbar />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary md:text-4xl">Danh sách phòng</h1>
            <p className="mt-2 text-secondary">
              {filteredRooms.length} phòng tại <span className="font-semibold text-primary">{buildingName}</span>
            </p>
          </div>
          <Link to={`/buildings/${buildingId}`} className="text-sm font-semibold text-primary hover:text-secondary">
            Quay lại
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
            <aside className="h-fit self-start rounded-2xl border border-muted/20 bg-white p-5">
              <h2 className="text-2xl font-bold text-primary">Loại phòng</h2>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => handleToggleType("all")}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                    selectedTypeIds.length === 0
                      ? "bg-primary text-white"
                      : "text-secondary hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedTypeIds.length === 0} onChange={() => {}} />
                    Tất cả loại phòng
                  </span>
                  <span className="font-semibold">{rooms.length}</span>
                </button>
                {roomTypeFilters.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleToggleType(type.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                      selectedTypeIds.includes(type.id)
                        ? "bg-primary text-white"
                        : "text-secondary hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedTypeIds.includes(type.id)}
                        onChange={() => {}}
                      />
                      {type.name}
                    </span>
                    <span className="font-semibold">{type.count}</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className="space-y-5">
              <div className="flex justify-end">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="rounded-xl border border-muted/30 bg-white px-3 py-2 text-sm text-secondary"
                >
                  <option value="asc">Giá: Thấp đến cao</option>
                  <option value="desc">Giá: Cao đến thấp</option>
                </select>
              </div>

              {filteredRooms.map((room) => (
                (() => {
                  const detailType = roomTypeDetails[room.room_type?.id] || room.room_type || {};
                  return (
                <article
                  key={room.id}
                  className="grid grid-cols-1 gap-4 rounded-3xl border border-muted/20 bg-white p-5 shadow-sm md:grid-cols-[220px_1fr_180px]"
                >
                  <img
                    src={room.thumbnail_url || room.images?.[0]?.image_url || defaultRoomImg}
                    alt={room.room_type?.name || room.room_number}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultRoomImg;
                    }}
                    className="h-52 w-full rounded-2xl object-cover"
                  />

                  <div>
                    <h3 className="text-3xl font-bold leading-tight text-primary">{detailType.name || "Phòng"}</h3>
                    <p className="mt-1 text-sm text-secondary">
                      {room.building?.name} - Phòng {room.room_number}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <span className="flex items-center gap-1.5 rounded-full bg-tea/60 px-3 py-1.5 font-medium text-primary">
                        <Users className="h-3.5 w-3.5" />
                        {detailType.capacity_min ?? "N/A"}-{detailType.capacity_max ?? "N/A"} người
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full bg-olive/30 px-3 py-1.5 font-medium text-primary">
                        <Ruler className="h-3.5 w-3.5" />
                        {detailType.area_sqm ?? "N/A"} m²
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full bg-muted/25 px-3 py-1.5 font-medium text-secondary">
                        <BedDouble className="h-3.5 w-3.5" />
                        {detailType.bedrooms ?? "N/A"} phòng ngủ
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full bg-muted/25 px-3 py-1.5 font-medium text-secondary">
                        <Bath className="h-3.5 w-3.5" />
                        {detailType.bathrooms ?? "N/A"} phòng tắm
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      <p className="text-sm text-secondary">Giá từ</p>
                      <p className="text-4xl font-bold text-primary">{formatVnd(detailType.base_price)}</p>
                      <p className="text-sm text-secondary">/tháng</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/buildings/${buildingId}/rooms/${room.id}`)}
                      className="h-11 rounded-full bg-olive px-6 text-sm font-semibold text-primary transition-colors hover:bg-tea"
                    >
                      Xem thêm
                    </button>
                  </div>
                </article>
                  );
                })()
              ))}
            </div>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}

export default function BuildingRoomsPage() {
  return (
    <LocationsProvider>
      <BuildingRoomsContent />
    </LocationsProvider>
  );
}
