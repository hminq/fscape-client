import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Input } from "@heroui/react";
import { Lock, Envelope, Eye, EyeSlash } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";

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

const VI_ERRORS = {
  "Invalid credentials": "Thông tin đăng nhập không hợp lệ. Email hoặc mật khẩu không chính xác.",
  "User account is deactivated": "Thông tin đăng nhập không hợp lệ. Email hoặc mật khẩu không chính xác.",
  "User not found": "Thông tin đăng nhập không hợp lệ. Email hoặc mật khẩu không chính xác.",
  "Email not verified": "Email của bạn chưa được xác minh. Vui lòng kiểm tra hộp thư.",
  "Too many requests": "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.",
  "Network Error": "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.",
  "Failed to fetch": "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.",
  "Load failed": "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.",
  "TypeError: Failed to fetch": "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.",
  "Google email not verified": "Email Google chưa được xác minh.",
  "Google account already linked to another user": "Thông tin đăng nhập không hợp lệ. Email hoặc mật khẩu không chính xác.",
  "Dữ liệu không hợp lệ": "Thông tin không hợp lệ. Vui lòng kiểm tra lại.",
};

const translateError = (err) => {
  const message = err?.message || String(err);
  if (message.includes("Failed to fetch") || message.includes("Load failed") || message.includes("NetworkError")) {
    return "Không thể kết nối đến máy chủ (Server có thể đang tắt).";
  }
  if (err?.response?.errors && err.response.errors.length > 0) {
    return err.response.errors[0].msg;
  }
  return VI_ERRORS[message] || message || "Đăng nhập thất bại. Vui lòng thử lại.";
};

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const clearField = (k) => {
    setFieldErrors(p => { const n = { ...p }; delete n[k]; return n; });
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!email.trim()) errs.email = "Vui lòng nhập email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email không hợp lệ.";
    if (!password) errs.password = "Vui lòng nhập mật khẩu.";
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await api.post("/api/auth/app/login", { email, password });
      const accessToken = res?.access_token;
      const user = res?.user;

      if (!accessToken) throw new Error("Phản hồi đăng nhập không có access token.");

      if (INTERNAL_ROLES.includes(user?.role)) {
        setFormError("Thông tin đăng nhập không hợp lệ. Email hoặc mật khẩu không chính xác.");
        setFieldErrors({ email: " ", password: " " });
        return;
      }

      login(accessToken, user);
      const params = new URLSearchParams(location.search);
      navigate(params.get("returnTo") || "/", { replace: true });
    } catch (err) {
      if (err.response?.errors) {
        const backendErrs = {};
        err.response.errors.forEach(e => {
          backendErrs[e.param || e.path] = e.msg;
        });
        setFieldErrors(backendErrs);
      } else {
        const msg = translateError(err);
        const isCredentialError = ["Invalid credentials", "User not found"].includes(err.message);
        if (isCredentialError) {
          setFormError("Thông tin đăng nhập không hợp lệ. Email hoặc mật khẩu không chính xác.");
          setFieldErrors({ email: " ", password: " " });
        } else {
          setFormError(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
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
            setFieldErrors({ email: " ", password: " " });
            return;
          }
          login(accessToken, user);
          const params = new URLSearchParams(location.search);
          navigate(params.get("returnTo") || "/", { replace: true });
        } else {
          navigate("/verify-otp", { state: { access_token: tokenResponse.access_token, flow: "google" } });
        }
      } catch (err) {
        setFormError(translateError(err));
      }
    },
    onError: () => setFormError("Không thể đăng nhập bằng Google."),
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
          {formError}
        </div>
      )}
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
        placeholder="Nhập mật khẩu"
        value={password}
        onValueChange={(v) => { setPassword(v); clearField("password"); }}
        type={showPassword ? "text" : "password"}
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

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer text-secondary">
          <input type="checkbox" className="accent-olive w-4 h-4" />
          Ghi nhớ tôi
        </label>
        <a href="#" className="font-semibold text-olive hover:text-muted transition-colors">
          Quên mật khẩu?
        </a>
      </div>

      <Button
        type="submit"
        radius="lg"
        isLoading={loading}
        className="bg-olive text-primary font-bold text-base h-12 mt-1 shadow-lg shadow-olive/30 hover:shadow-olive/50"
      >
        {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
      </Button>

      <div className="flex items-center gap-3 text-muted text-sm">
        <div className="flex-1 h-px bg-muted/20" />
        <span>Hoặc tiếp tục với</span>
        <div className="flex-1 h-px bg-muted/20" />
      </div>

      <button
        type="button"
        onClick={() => handleGoogleLogin()}
        className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border-2 border-muted/20 bg-white hover:bg-gray-50 hover:border-muted/40 active:scale-[0.98] transition-all font-semibold text-sm text-secondary shadow-sm"
      >
        <GoogleIcon />
        Đăng nhập với Google
      </button>

    </form>
  );
}
