import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Select, SelectItem, Divider, Spinner } from "@heroui/react";
import { Camera, ArrowLeft, User, Phone, MapPin, Calendar, IdentificationBadge, Warning, CheckCircle } from "@phosphor-icons/react";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const GENDER_OPTIONS = [
  { key: "MALE", label: "Nam" },
  { key: "FEMALE", label: "Nữ" },
  { key: "OTHER", label: "Khác" },
];

function ProfileContent() {
  const navigate = useNavigate();
  const { user, login, token, isLoggedIn } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar_url, setAvatarUrl] = useState("");
  const [gender, setGender] = useState("");
  const [date_of_birth, setDateOfBirth] = useState("");
  const [permanent_address, setPermanentAddress] = useState("");
  const [emergency_contact_name, setEmergencyContactName] = useState("");
  const [emergency_contact_phone, setEmergencyContactPhone] = useState("");

  const clearFieldError = (k) => {
    setFieldErrors(p => { 
        const n = { ...p }; 
        delete n[k]; 
        return n; 
    });
    setError("");
  };

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/user-profile/me");
        const data = res.data;
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setPhone(data.phone || "");
          setAvatarUrl(data.avatar_url || "");
          const p = data.profile;
          if (p) {
            setGender(p.gender || "");
            setDateOfBirth(p.date_of_birth || "");
            setPermanentAddress(p.permanent_address || "");
            setEmergencyContactName(p.emergency_contact_name || "");
            setEmergencyContactPhone(p.emergency_contact_phone || "");
          }
        }
      } catch (err) {
        setError("Không thể tải thông tin hồ sơ.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isLoggedIn]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.upload("/api/upload?type=avatar", formData);
      const newUrl = uploadRes.urls[0];
      setAvatarUrl(newUrl);

      const updateRes = await api.put("/api/user-profile/me", { avatar_url: newUrl });
      login(token, { ...user, ...updateRes.data });
      setSuccess("Đã cập nhật ảnh đại diện.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Lỗi khi tải lên ảnh.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    setFieldErrors({});

    const errs = {};
    if (!last_name.trim()) errs.last_name = "Họ không được để trống";
    if (!first_name.trim()) errs.first_name = "Tên không được để trống";
    if (!phone.trim()) errs.phone = "Số điện thoại không được để trống";
    
    if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        setError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
        setSaving(false);
        return;
    }

    try {
      const payload = {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone: phone.trim(),
        gender: gender || null,
        date_of_birth: date_of_birth || null,
        permanent_address: permanent_address.trim() || null,
        emergency_contact_name: emergency_contact_name.trim() || null,
        emergency_contact_phone: emergency_contact_phone.trim() || null,
      };
      const res = await api.put("/api/user-profile/me", payload);
      login(token, { ...user, ...res.data });
      setSuccess("Cập nhật hồ sơ thành công!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Update profile error:", err);
      if (err.response?.errors) {
        const backendErrs = {};
        err.response.errors.forEach(e => {
            const path = e.param || e.path;
            backendErrs[path] = e.msg;
        });
        setFieldErrors(backendErrs);
        setError(`Vui lòng kiểm tra lại: ${err.response.errors[0].msg}`);
      } else {
        setError(err.message || "Cập nhật hồ sơ thất bại.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" color="primary" />
        <p className="text-muted text-sm animate-pulse">Đang tải hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-secondary hover:text-olive transition-colors mb-2"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại</span>
          </button>
          <h1 className="text-3xl font-extrabold text-secondary tracking-tight">Hồ sơ của tôi</h1>
          <p className="text-muted text-sm mt-1">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-muted/20 p-3 rounded-2xl shadow-sm">
          <div className="relative group">
            <div className="size-16 rounded-full overflow-hidden border-2 border-olive/30 bg-gray-50 flex items-center justify-center">
              {avatar_url ? (
                <img src={avatar_url} alt="Avatar" className="size-full object-cover" />
              ) : (
                <User className="size-8 text-muted/40" weight="bold" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 size-7 rounded-full bg-olive text-primary flex items-center justify-center border-2 border-white shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              {uploading ? <Spinner size="sm" color="white" /> : <Camera className="size-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div>
            <p className="font-bold text-secondary">{last_name} {first_name}</p>
            <p className="text-xs text-muted">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-olive/5 rounded-2xl p-6 border border-olive/10">
            <h3 className="font-bold text-secondary mb-3 flex items-center gap-2">
              <IdentificationBadge className="size-5 text-olive" />
              Thông tin xác thực
            </h3>
            <p className="text-sm text-secondary/70 leading-relaxed mb-4">
              Cập nhật thông tin chính xác giúp chúng tôi hỗ trợ bạn tốt hơn trong việc ký kết hợp đồng và xác minh cư trú.
            </p>
            <Divider className="my-4 bg-olive/10" />
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-secondary/60">
                <CheckCircle className="size-4 text-green-500" weight="fill" />
                <span>Email đã xác thực</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-secondary/60">
                <CheckCircle className="size-4 text-green-500" weight="fill" />
                <span>Bảo mật 2 lớp: Tắt</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 animate-in fade-in slide-in-from-top-2">
              <Warning className="size-5 flex-shrink-0" weight="fill" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-50 border border-green-100 p-4 text-sm text-green-700 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="size-5 flex-shrink-0" weight="fill" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white rounded-2xl border border-muted/20 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-secondary mb-6 flex items-center gap-2">
                <User className="size-5 text-olive" weight="fill" />
                Thông tin cơ bản
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Họ"
                  placeholder="Nguyễn"
                  value={last_name}
                  onValueChange={(v) => { setLastName(v); clearFieldError("last_name"); }}
                  variant="bordered"
                  radius="lg"
                  isRequired
                  isInvalid={!!fieldErrors.last_name}
                  errorMessage={fieldErrors.last_name}
                  classNames={{ errorMessage: "text-red-600 font-medium text-[11px] mt-1" }}
                />
                <Input
                  label="Tên"
                  placeholder="Thành Nam"
                  value={first_name}
                  onValueChange={(v) => { setFirstName(v); clearFieldError("first_name"); }}
                  variant="bordered"
                  radius="lg"
                  isRequired
                  isInvalid={!!fieldErrors.first_name}
                  errorMessage={fieldErrors.first_name}
                  classNames={{ errorMessage: "text-red-600 font-medium text-[11px] mt-1" }}
                />
                <Input
                  label="Số điện thoại"
                  placeholder="09xx xxx xxx"
                  value={phone}
                  onValueChange={(v) => { setPhone(v); clearFieldError("phone"); }}
                  variant="bordered"
                  radius="lg"
                  isRequired
                  startContent={<Phone className="size-4 text-muted" />}
                  isInvalid={!!fieldErrors.phone}
                  errorMessage={fieldErrors.phone}
                  classNames={{ errorMessage: "text-red-600 font-medium text-[11px] mt-1" }}
                />
                <Select
                  label="Giới tính"
                  placeholder="Chọn giới tính"
                  selectedKeys={gender ? [gender] : []}
                  onSelectionChange={(keys) => { setGender([...keys][0] || ""); clearFieldError("gender"); }}
                  variant="bordered"
                  radius="lg"
                  isInvalid={!!fieldErrors.gender}
                  errorMessage={fieldErrors.gender}
                  classNames={{ errorMessage: "text-red-600 font-medium text-[11px] mt-1" }}
                >
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g.key}>{g.label}</SelectItem>
                  ))}
                </Select>
                <div className="md:col-span-2">
                   <Input
                    label="Ngày sinh"
                    type="date"
                    value={date_of_birth}
                    onValueChange={(v) => { setDateOfBirth(v); clearFieldError("date_of_birth"); }}
                    variant="bordered"
                    radius="lg"
                    startContent={<Calendar className="size-4 text-muted" />}
                    isInvalid={!!fieldErrors.date_of_birth}
                    errorMessage={fieldErrors.date_of_birth}
                    classNames={{ errorMessage: "text-red-600 font-medium text-[11px] mt-1" }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-muted/20 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-secondary mb-6 flex items-center gap-2">
                <MapPin className="size-5 text-olive" weight="fill" />
                Địa chỉ & Liên hệ
              </h2>
              <div className="space-y-6">
                <Input
                  label="Địa chỉ thường trú"
                  placeholder="Số nhà, tên đường, phường/xã..."
                  value={permanent_address}
                  onValueChange={(v) => { setPermanentAddress(v); clearFieldError("permanent_address"); }}
                  variant="bordered"
                  radius="lg"
                  isInvalid={!!fieldErrors.permanent_address}
                  errorMessage={fieldErrors.permanent_address}
                  classNames={{ errorMessage: "text-red-600 font-medium text-[11px] mt-1" }}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <Input
                    label="Người liên hệ khẩn cấp"
                    placeholder="Họ và tên"
                    value={emergency_contact_name}
                    onValueChange={(v) => { setEmergencyContactName(v); clearFieldError("emergency_contact_name"); }}
                    variant="bordered"
                    radius="lg"
                    isInvalid={!!fieldErrors.emergency_contact_name}
                    errorMessage={fieldErrors.emergency_contact_name}
                    classNames={{ errorMessage: "text-red-600 font-medium text-[11px] mt-1" }}
                  />
                  <Input
                    label="SĐT khẩn cấp"
                    placeholder="09xx xxx xxx"
                    value={emergency_contact_phone}
                    onValueChange={(v) => { setEmergencyContactPhone(v); clearFieldError("emergency_contact_phone"); }}
                    variant="bordered"
                    radius="lg"
                    isInvalid={!!fieldErrors.emergency_contact_phone}
                    errorMessage={fieldErrors.emergency_contact_phone}
                    classNames={{ errorMessage: "text-red-600 font-medium text-[11px] mt-1" }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                isLoading={saving}
                radius="xl"
                className="bg-olive text-primary font-bold px-10 h-14 text-base shadow-xl shadow-olive/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Lưu Thay Đổi
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <LocationsProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <AppNavbar />
        <main className="flex-1 bg-gray-50/50">
          <ProfileContent />
        </main>
        <Footer />
      </div>
    </LocationsProvider>
  );
}
