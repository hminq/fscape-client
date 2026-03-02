import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Bath, BedDouble, ChevronLeft, ChevronRight, Loader2, Ruler, Users } from "lucide-react";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { api } from "@/lib/api";
import { formatVnd } from "@/lib/formatters";
import defaultRoomImg from "@/assets/default_room_img.jpg";

const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let mounted = true;

    async function fetchRooms() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/api/rooms?building_id=${buildingId}&limit=${PAGE_SIZE}&page=${page}`);
        if (!mounted) return;
        const roomList = res?.data || [];
        setRooms(roomList);

        const pagination = res?.pagination || res?.meta;
        if (pagination) {
          setTotalPages(pagination.totalPages || pagination.total_pages || Math.ceil((pagination.total || roomList.length) / PAGE_SIZE));
        } else {
          setTotalPages(1);
        }

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
  }, [buildingId, page]);

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
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary md:text-4xl">Danh sách phòng</h1>
            <p className="mt-2 text-secondary">
              {filteredRooms.length} phòng tại <span className="font-semibold text-primary">{buildingName}</span>
            </p>
          </div>
          <Link
            to={`/buildings/${buildingId}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
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
            <aside className="h-fit self-start rounded-2xl border border-muted/20 bg-white p-4">
              <h2 className="text-lg font-bold text-primary">Loại phòng</h2>
              <div className="mt-3 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleToggleType("all")}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                    selectedTypeIds.length === 0
                      ? "bg-primary text-white"
                      : "text-secondary hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedTypeIds.length === 0} onChange={() => {}} className="h-3.5 w-3.5" />
                    Tất cả loại phòng
                  </span>
                  <span className="font-semibold">{rooms.length}</span>
                </button>
                {roomTypeFilters.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleToggleType(type.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
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
                        className="h-3.5 w-3.5"
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

              {filteredRooms.length === 0 ? (
                <p className="py-16 text-center text-secondary">Không có phòng nào phù hợp.</p>
              ) : filteredRooms.map((room) => (
                (() => {
                  const detailType = roomTypeDetails[room.room_type?.id] || room.room_type || {};
                  return (
                <article
                  key={room.id}
                  className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-muted/20 bg-white md:grid-cols-[200px_1fr]"
                >
                  <img
                    src={room.thumbnail_url || room.images?.[0]?.image_url || defaultRoomImg}
                    alt={room.room_type?.name || room.room_number}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultRoomImg;
                    }}
                    className="h-48 w-full object-cover md:h-full"
                  />

                  <div className="flex flex-col p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold leading-tight text-primary">{detailType.name || "Phòng"}</h3>
                        <p className="mt-0.5 text-sm text-secondary">Phòng {room.room_number}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted">Giá từ</p>
                        <p className="text-2xl font-bold text-primary">{formatVnd(detailType.base_price)}</p>
                        <p className="text-xs text-secondary">/tháng</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-4 pt-3">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-olive" />
                          {detailType.capacity_min ?? "N/A"}-{detailType.capacity_max ?? "N/A"} người
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Ruler className="h-4 w-4 text-olive" />
                          {detailType.area_sqm ?? "N/A"} m²
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BedDouble className="h-4 w-4 text-olive" />
                          {detailType.bedrooms ?? "N/A"} phòng ngủ
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Bath className="h-4 w-4 text-olive" />
                          {detailType.bathrooms ?? "N/A"} phòng tắm
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/buildings/${buildingId}/rooms/${room.id}`)}
                        className="shrink-0 h-9 rounded-full bg-olive px-5 text-sm font-semibold text-primary transition-colors hover:bg-tea"
                      >
                        Xem thêm
                      </button>
                    </div>
                  </div>
                </article>
                  );
                })()
              ))}

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-muted/30 transition-colors ${
                      page <= 1 ? "cursor-not-allowed text-secondary/30" : "text-secondary hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`h-10 w-10 rounded-full text-sm font-semibold transition-colors ${
                        p === page
                          ? "bg-primary text-white"
                          : "text-secondary hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-muted/30 transition-colors ${
                      page >= totalPages ? "cursor-not-allowed text-secondary/30" : "text-secondary hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
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
