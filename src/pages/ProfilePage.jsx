import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { Camera, CircleNotch, ArrowLeft } from "@phosphor-icons/react";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { LocationsProvider } from "@/contexts/LocationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import defaultAvatar from "../assets/default_room_img.jpg";

const GENDER_OPTIONS = [
  { key: "MALE", label: "Nam" },
  { key: "FEMALE", label: "Nữ" },
  { key: "OTHER", label: "Khác" },
];

function ProfileContent() {
  const navigate = useNavigate();
  const { user, login, token, isLoggedIn } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // User fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Customer profile fields
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/user-profile/me");
        const data = res.data;
        setProfile(data);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setPhone(data.phone || "");
        setAvatarUrl(data.avatar_url || "");
        // Customer profile
        const p = data.profile;
        if (p) {
          setGender(p.gender || "");
          setDateOfBirth(p.date_of_birth || "");
          setPermanentAddress(p.permanent_address || "");
          setEmergencyContactName(p.emergency_contact_name || "");
          setEmergencyContactPhone(p.emergency_contact_phone || "");
        }
      } catch (err) {
        setError(err.message);
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
      setError("Vui lòng chọn file ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 5MB");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.upload("/api/upload?type=avatar", formData);
      const url = uploadRes.urls[0];
      setAvatarUrl(url);

      const updateRes = await api.put("/api/user-profile/me", { avatar_url: url });
      login(token, { ...user, ...updateRes.data });
      setSuccess("Cập nhật ảnh đại diện thành công");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        gender: gender || null,
        date_of_birth: dateOfBirth || null,
        permanent_address: permanentAddress.trim() || null,
        emergency_contact_name: emergencyContactName.trim() || null,
        emergency_contact_phone: emergencyContactPhone.trim() || null,
      };
      const res = await api.put("/api/user-profile/me", payload);
      login(token, { ...user, ...res.data });
      setSuccess("Cập nhật hồ sơ thành công");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CircleNotch className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="max-w-2xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="size-4" />
        Quay lại
      </button>

      <h1 className="text-3xl font-bold text-primary mb-8">Hồ sơ của tôi</h1>

      {/* Avatar */}
      <div className="flex items-center gap-6 mb-10">
        <div className="relative group">
          <img
            src={avatarUrl || defaultAvatar}
            alt="Avatar"
            className="size-24 rounded-full border-2 border-primary/20 object-cover bg-white"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploading ? (
              <CircleNotch className="size-6 text-white animate-spin" />
            ) : (
              <Camera className="size-6 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <div>
          <p className="font-semibold text-primary text-lg">
            {profile?.first_name || profile?.last_name
              ? `${profile.last_name || ""} ${profile.first_name || ""}`.trim()
              : "Chưa cập nhật tên"}
          </p>
          <p className="text-sm text-secondary">{profile?.email}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm text-olive hover:underline mt-1"
          >
            {uploading ? "Đang tải lên..." : "Thay đổi ảnh đại diện"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* --- Thông tin tài khoản --- */}
        <div>
          <h2 className="text-lg font-bold text-primary mb-5">Thông tin tài khoản</h2>
          <div className="space-y-5">
            <Input
              label="Email"
              value={profile?.email || ""}
              variant="bordered"
              isDisabled
              classNames={{ label: "text-secondary" }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Họ"
                placeholder="Nguyễn"
                value={lastName}
                onValueChange={setLastName}
                variant="bordered"
                classNames={{ label: "text-secondary" }}
              />
              <Input
                label="Tên"
                placeholder="Văn A"
                value={firstName}
                onValueChange={setFirstName}
                variant="bordered"
                classNames={{ label: "text-secondary" }}
              />
            </div>
            <Input
              label="Số điện thoại"
              placeholder="0912 345 678"
              value={phone}
              onValueChange={setPhone}
              variant="bordered"
              classNames={{ label: "text-secondary" }}
            />
          </div>
        </div>

        {/* --- Thông tin cá nhân --- */}
        <div>
          <h2 className="text-lg font-bold text-primary mb-5">Thông tin cá nhân</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Select
                label="Giới tính"
                placeholder="Chọn giới tính"
                selectedKeys={gender ? [gender] : []}
                onSelectionChange={(keys) => setGender([...keys][0] || "")}
                variant="bordered"
                classNames={{ label: "text-secondary" }}
              >
                {GENDER_OPTIONS.map((g) => (
                  <SelectItem key={g.key}>{g.label}</SelectItem>
                ))}
              </Select>
              <Input
                label="Ngày sinh"
                type="date"
                value={dateOfBirth}
                onValueChange={setDateOfBirth}
                variant="bordered"
                classNames={{ label: "text-secondary" }}
              />
            </div>
            <Input
              label="Địa chỉ thường trú"
              placeholder="123 Đường ABC, Quận 1, TP.HCM"
              value={permanentAddress}
              onValueChange={setPermanentAddress}
              variant="bordered"
              classNames={{ label: "text-secondary" }}
            />
          </div>
        </div>

        {/* --- Liên hệ khẩn cấp --- */}
        <div>
          <h2 className="text-lg font-bold text-primary mb-5">Liên hệ khẩn cấp</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Họ tên người liên hệ"
              placeholder="Nguyễn Văn B"
              value={emergencyContactName}
              onValueChange={setEmergencyContactName}
              variant="bordered"
              classNames={{ label: "text-secondary" }}
            />
            <Input
              label="Số điện thoại"
              placeholder="0987 654 321"
              value={emergencyContactPhone}
              onValueChange={setEmergencyContactPhone}
              variant="bordered"
              classNames={{ label: "text-secondary" }}
            />
          </div>
        </div>

        <div>
          <Button
            type="submit"
            radius="full"
            isLoading={saving}
            className="bg-primary text-white font-semibold px-8 h-11"
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </section>
  );
}

export default function ProfilePage() {
  return (
    <LocationsProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <AppNavbar />
        <div className="flex-1">
          <ProfileContent />
        </div>
        <Footer />
      </div>
    </LocationsProvider>
  );
}
