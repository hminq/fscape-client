import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CircleNotch, ArrowLeft, MapPin, CalendarDots, FileText, DownloadSimple, X, Eye, PenNib, MagnifyingGlass, FunnelSimple, CaretDown, CaretUp } from "@phosphor-icons/react";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatDisplayDate } from "@/lib/formatters";

const STATUS_CONFIG = {
  DRAFT: { text: "Bản nháp", className: "bg-gray-100 text-gray-600" },
  PENDING_CUSTOMER_SIGNATURE: { text: "Chờ bạn ký", className: "bg-amber-100 text-amber-700" },
  PENDING_MANAGER_SIGNATURE: { text: "Chờ quản lý ký", className: "bg-blue-100 text-blue-700" },
  PENDING_FIRST_PAYMENT: { text: "Chờ thanh toán kỳ đầu", className: "bg-orange-100 text-orange-700" },
  PENDING_CHECK_IN: { text: "Chờ nhận phòng", className: "bg-cyan-100 text-cyan-700" },
  ACTIVE: { text: "Đang hiệu lực", className: "bg-green-100 text-green-700" },
  EXPIRING_SOON: { text: "Sắp hết hạn", className: "bg-amber-100 text-amber-700" },
  FINISHED: { text: "Đã kết thúc", className: "bg-gray-100 text-gray-600" },
  TERMINATED: { text: "Đã chấm dứt", className: "bg-red-100 text-red-600" },
};

const STATUS_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "action_needed", label: "Cần xử lý" },
  { value: "ACTIVE", label: "Đang hiệu lực" },
  { value: "EXPIRING_SOON", label: "Sắp hết hạn" },
  { value: "FINISHED", label: "Đã kết thúc" },
  { value: "TERMINATED", label: "Đã chấm dứt" },
];

const ACTION_NEEDED_STATUSES = ["DRAFT", "PENDING_CUSTOMER_SIGNATURE", "PENDING_MANAGER_SIGNATURE", "PENDING_FIRST_PAYMENT"];

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

function MyContractsContent() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const fetchContracts = async () => {
      try {
        const res = await api.get("/api/contracts/my");
        setContracts(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [isLoggedIn, navigate]);

  const filtered = useMemo(() => {
    let result = [...contracts];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => {
        const room = c.room;
        const building = room?.building;
        const roomType = room?.room_type;
        return (
          c.contract_number?.toLowerCase().includes(q) ||
          room?.room_number?.toLowerCase().includes(q) ||
          building?.name?.toLowerCase().includes(q) ||
          roomType?.name?.toLowerCase().includes(q)
        );
      });
    }

    // Status filter
    if (statusFilter === "action_needed") {
      result = result.filter((c) => ACTION_NEEDED_STATUSES.includes(c.status));
    } else if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    return result;
  }, [contracts, searchQuery, statusFilter]);

  const actionNeededCount = contracts.filter((c) => ACTION_NEEDED_STATUSES.includes(c.status)).length;

  const openPreview = (contract) => {
    setPreviewHtml(contract.rendered_content);
    setPreviewTitle(contract.contract_number);
  };

  const closePreview = () => {
    setPreviewHtml(null);
    setPreviewTitle("");
  };

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
          <h1 className="text-3xl font-bold text-primary mb-1">Hợp đồng của tôi</h1>
          <p className="text-secondary text-sm">
            {contracts.length > 0
              ? `${contracts.length} hợp đồng`
              : "Xem và quản lý các hợp đồng thuê phòng."}
            {actionNeededCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                {actionNeededCount} cần xử lý
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

      {contracts.length === 0 && !error ? (
        <div className="text-center py-20">
          <p className="text-lg text-secondary mb-4">Bạn chưa có hợp đồng nào.</p>
          <Link
            to="/rooms"
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-white"
          >
            Tìm phòng ngay
          </Link>
        </div>
      ) : (
        <>
          {/* Toolbar: Search + Filters + Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-secondary/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã hợp đồng, phòng, tòa nhà..."
                className="w-full rounded-full border border-muted/30 bg-white py-2 pl-10 pr-4 text-sm text-primary outline-none transition-colors placeholder:text-secondary/40 focus:border-primary hover:border-primary"
              />
            </div>

            {/* Status filter */}
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
              <p className="text-secondary">Không tìm thấy hợp đồng phù hợp.</p>
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
              {filtered.map((c) => (
                <ContractRow key={c.id} contract={c} onPreview={openPreview} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Preview modal */}
      {previewHtml && (
        <ContractPreviewModal
          html={previewHtml}
          title={previewTitle}
          onClose={closePreview}
        />
      )}
    </section>
  );
}

function ContractRow({ contract, onPreview }) {
  const room = contract.room;
  const building = room?.building;
  const statusInfo = STATUS_CONFIG[contract.status] || STATUS_CONFIG.DRAFT;
  const isTerminal = contract.status === "FINISHED" || contract.status === "TERMINATED";
  const needsSign = contract.status === "PENDING_CUSTOMER_SIGNATURE";

  return (
    <div className={`flex flex-col sm:flex-row gap-4 rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md ${isTerminal ? "border-gray-100 opacity-70" : needsSign ? "border-amber-200 bg-amber-50/30" : "border-gray-200"}`}>
      {/* Icon */}
      <div className="hidden sm:flex items-center">
        <FileText className="size-5 text-olive shrink-0" />
      </div>

      {/* Contract info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-primary truncate">
          {contract.contract_number}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary mt-1">
          {building && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {building.name} - {room?.room_number}
            </span>
          )}
          <span className="flex items-center gap-1">
            <CalendarDots className="size-3" />
            {formatDisplayDate(contract.start_date)} — {formatDisplayDate(contract.end_date)}
          </span>
        </div>

        <span className={`inline-flex mt-2 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.className}`}>
          {statusInfo.text}
        </span>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
        {contract.rendered_content && (
          <button
            onClick={() => onPreview(contract)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-secondary hover:bg-gray-50 transition-colors"
          >
            <Eye className="size-4" />
            Xem
          </button>
        )}
        {needsSign && (
          <Link
            to={`/sign?contractId=${contract.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            <PenNib className="size-4" />
            Ký hợp đồng
          </Link>
        )}
        {contract.pdf_url && (
          <a
            href={contract.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <DownloadSimple className="size-4" />
            Tải PDF
          </a>
        )}
      </div>
    </div>
  );
}

function ContractPreviewModal({ html, title, onClose }) {
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 sm:inset-8 md:inset-12 z-[70] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-bold text-primary text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-9 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content — rendered HTML */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </>
  );
}

export default function MyContractsPage() {
  return (
    <LocationsProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <AppNavbar />
        <div className="flex-1">
          <MyContractsContent />
        </div>
        <Footer />
      </div>
    </LocationsProvider>
  );
}
