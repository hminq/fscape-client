import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@heroui/react";
import { Lock, Envelope, Eye, EyeSlash, User } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";

const INTERNAL_ROLES = ["ADMIN", "BUILDING_MANAGER", "STAFF"];

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" className="shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const inputClasses = { inputWrapper: "border-muted/30 hover:border-muted focus-within:border-olive" };

export default function SignUpForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const clearField = (k) => {
    setFieldErrors(p => { const n = { ...p }; delete n[k]; return n; });
    setFormError("");
  };

const VI_ERRORS = {
  "Email already exists": "Email này đã được đăng ký. Vui lòng đăng nhập.",
  "OTP request limit exceeded (5/day)": "Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau 24 giờ.",
  "Google email not verified": "Email Google chưa được xác minh.",
  "Google account already linked to another user": "Thông tin đăng nhập không hợp lệ. Email hoặc mật khẩu không chính xác.",
  "User account is deactivated": "Thông tin đăng nhập không hợp lệ. Email hoặc mật khẩu không chính xác.",
  "Network Error": "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.",
  "Failed to fetch": "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.",
  "Load failed": "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.",
  "Dữ liệu không hợp lệ": "Thông tin không hợp lệ hoặc mật khẩu quá đơn giản. Vui lòng kiểm tra lại.",
};

const translateError = (err) => {
  const message = err?.message || String(err);
  if (message.includes("Failed to fetch") || message.includes("Load failed") || message.includes("NetworkError")) {
    return "Không thể kết nối đến máy chủ (Server có thể đang tắt).";
  }
  if (err?.response?.errors && err.response.errors.length > 0) {
    return err.response.errors[0].msg;
  }
  return VI_ERRORS[message] || message || "Thao tác thất bại. Vui lòng thử lại.";
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!fullName.trim()) errs.fullName = "Vui lòng nhập họ và tên.";
    if (!email.trim()) errs.email = "Vui lòng nhập email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email không hợp lệ.";
    if (password.length < 6) errs.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    else if (password !== confirmPassword) errs.confirmPassword = "Mật khẩu xác nhận không khớp.";

    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setFieldErrors({});
    setLoading(true);

    try {
      await api.post("/api/auth/signup", { email, password });
      navigate("/verify-otp", { state: { email, password, flow: "signup" } });
    } catch (err) {
      if (err.response?.errors) {
        const backendErrs = {};
        err.response.errors.forEach(e => {
          backendErrs[e.param || e.path] = e.msg;
        });
        setFieldErrors(backendErrs);
      } else {
        setFormError(translateError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await api.post("/api/auth/google", {
          id_token: tokenResponse.access_token,
          token_type: "access_token",
        });
        const accessToken = res?.access_token;
        const user = res?.user;
        if (accessToken) {
          if (INTERNAL_ROLES.includes(user?.role)) {
            setFormError("Thông tin đăng nhập không hợp lệ. Email hoặc mật khẩu không chính xác.");
            return;
          }
          login(accessToken, user);
          navigate("/", { replace: true });
        } else {
          navigate("/verify-otp", { state: { access_token: tokenResponse.access_token, flow: "google" } });
        }
      } catch (err) {
        setFormError(translateError(err));
      }
    },
    onError: () => setFormError("Không thể đăng ký bằng Google."),
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
          {formError}
        </div>
      )}
      <Input
        label="Họ và Tên"
        placeholder="Họ và tên đầy đủ"
        value={fullName}
        onValueChange={(v) => { setFullName(v); clearField("fullName"); }}
        startContent={<User className="size-4 text-muted" />}
        variant="bordered"
        isInvalid={!!fieldErrors.fullName}
        errorMessage={fieldErrors.fullName}
        classNames={inputClasses}
      />
      <Input
        label="Email"
        placeholder="sinhvien@truonghoc.edu.vn"
        value={email}
        onValueChange={(v) => { setEmail(v); clearField("email"); }}
        startContent={<Envelope className="size-4 text-muted" />}
        variant="bordered"
        isInvalid={!!fieldErrors.email}
        errorMessage={fieldErrors.email}
        classNames={inputClasses}
      />
      <Input
        label="Mật khẩu"
        placeholder="Tạo mật khẩu"
        type={showPassword ? "text" : "password"}
        value={password}
        onValueChange={(v) => { setPassword(v); clearField("password"); }}
        startContent={<Lock className="size-4 text-muted" />}
        endContent={
          <button type="button" className="text-muted hover:text-secondary" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        variant="bordered"
        isInvalid={!!fieldErrors.password}
        errorMessage={fieldErrors.password}
        classNames={inputClasses}
      />
      <Input
        label="Xác nhận mật khẩu"
        placeholder="Xác nhận mật khẩu"
        type={showConfirm ? "text" : "password"}
        value={confirmPassword}
        onValueChange={(v) => { setConfirmPassword(v); clearField("confirmPassword"); }}
        startContent={<Lock className="size-4 text-muted" />}
        endContent={
          <button type="button" className="text-muted hover:text-secondary" onClick={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        variant="bordered"
        isInvalid={!!fieldErrors.confirmPassword}
        errorMessage={fieldErrors.confirmPassword}
        classNames={inputClasses}
      />

      <Button
        type="submit"
        radius="lg"
        isLoading={loading}
        className="bg-olive text-primary font-bold text-base h-12 mt-1 shadow-lg shadow-olive/30"
      >
        {loading ? "Đang tạo tài khoản..." : "Tạo Tài Khoản"}
      </Button>

      <div className="flex items-center gap-3 text-muted text-sm">
        <div className="flex-1 h-px bg-muted/20" />
        <span>Hoặc tiếp tục với</span>
        <div className="flex-1 h-px bg-muted/20" />
      </div>

      <button
        type="button"
        onClick={() => handleGoogleSignup()}
        className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border-2 border-muted/20 bg-white hover:bg-gray-50 hover:border-muted/40 active:scale-[0.98] transition-all font-semibold text-sm text-secondary shadow-sm"
      >
        <GoogleIcon />
        Đăng ký với Google
      </button>

    </form>
  );
}
