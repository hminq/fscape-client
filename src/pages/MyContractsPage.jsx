import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CircleNotch, ArrowLeft, MapPin, CalendarDots, FileText, DownloadSimple, X, Eye } from "@phosphor-icons/react";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatVnd, formatDisplayDate } from "@/lib/formatters";

const STATUS_CONFIG = {
  DRAFT: { text: "Bản nháp", className: "bg-gray-100 text-gray-600" },
  PENDING_CUSTOMER_SIGNATURE: { text: "Chờ bạn ký", className: "bg-amber-100 text-amber-700" },
  PENDING_MANAGER_SIGNATURE: { text: "Chờ quản lý ký", className: "bg-blue-100 text-blue-700" },
  ACTIVE: { text: "Đang hiệu lực", className: "bg-green-100 text-green-700" },
  EXPIRING_SOON: { text: "Sắp hết hạn", className: "bg-amber-100 text-amber-700" },
  FINISHED: { text: "Đã kết thúc", className: "bg-gray-100 text-gray-600" },
  TERMINATED: { text: "Đã chấm dứt", className: "bg-red-100 text-red-600" },
};

function MyContractsContent() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

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

  // Split into active vs history
  const activeStatuses = ["DRAFT", "PENDING_CUSTOMER_SIGNATURE", "PENDING_MANAGER_SIGNATURE", "ACTIVE", "EXPIRING_SOON"];
  const active = contracts.filter((c) => activeStatuses.includes(c.status));
  const history = contracts.filter((c) => !activeStatuses.includes(c.status));

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="size-4" />
        Quay lại
      </button>

      <h1 className="text-3xl font-bold text-primary mb-2">Hợp đồng của tôi</h1>
      <p className="text-secondary mb-8">Xem và quản lý các hợp đồng thuê phòng.</p>

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
        <div className="space-y-10">
          {active.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-primary mb-4">Đang xử lý</h2>
              <div className="space-y-4">
                {active.map((c) => (
                  <ContractRow key={c.id} contract={c} onPreview={openPreview} />
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-primary mb-4">Lịch sử</h2>
              <div className="space-y-4">
                {history.map((c) => (
                  <ContractRow key={c.id} contract={c} onPreview={openPreview} />
                ))}
              </div>
            </div>
          )}
        </div>
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
  const roomType = room?.room_type;
  const statusInfo = STATUS_CONFIG[contract.status] || STATUS_CONFIG.DRAFT;
  const isTerminal = contract.status === "FINISHED" || contract.status === "TERMINATED";

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md ${isTerminal ? "border-gray-100 opacity-70" : "border-gray-200"}`}>
      {/* Left — contract info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5">
          <FileText className="size-5 text-olive shrink-0" />
          <h3 className="text-base font-bold text-primary truncate">
            {roomType?.name ? `${roomType.name} - ${room?.room_number}` : `Phòng ${room?.room_number}`}
          </h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.className}`}>
            {statusInfo.text}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary ml-8">
          {building && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {building.name}
              {room?.floor != null && <span>· Tầng {room.floor}</span>}
            </span>
          )}
          <span className="flex items-center gap-1">
            <CalendarDots className="size-3" />
            {formatDisplayDate(contract.start_date)} — {formatDisplayDate(contract.end_date)}
          </span>
          <span>{formatVnd(contract.base_rent)}/tháng</span>
        </div>

        <p className="text-[11px] text-secondary/50 ml-8 mt-1">{contract.contract_number}</p>

        {contract.status === "PENDING_CUSTOMER_SIGNATURE" && (
          <p className="text-amber-600 text-xs font-medium ml-8 mt-1">
            Vui lòng kiểm tra email để ký hợp đồng.
          </p>
        )}
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
