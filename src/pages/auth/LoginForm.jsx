import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Button, Input } from "@heroui/react";
import { Lock, Envelope, Eye, EyeSlash, Headset, Phone } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

const INTERNAL_ROLES = ["ADMIN", "BUILDING_MANAGER", "STAFF"];

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const inputClasses = { inputWrapper: "border-muted/30 hover:border-muted focus-within:border-olive" };

export default function LoginForm() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email hoặc tên đăng nhập là bắt buộc.";
    if (!password.trim()) newErrors.password = "Mật khẩu là bắt buộc.";
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await api.post("/api/auth/app/login", { email, password });

      const accessToken = res?.access_token;
      const user = res?.user;

      if (!accessToken) {
        throw new Error("Phản hồi đăng nhập không có access token.");
      }

      login(accessToken, user);

      const params = new URLSearchParams(location.search);
      const returnTo = params.get("returnTo");
      navigate(returnTo || "/", { replace: true });
    } catch (err) {
      const msgMap = {
        "Invalid credentials": "Email hoặc mật khẩu không chính xác.",
        "User account is deactivated": "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.",
        "OTP request limit exceeded (5/day)": "Bạn đã vượt quá số lần nhận OTP trong ngày (5 lần/ngày). Vui lòng thử lại sau.",
        "Internal server error": "Lỗi hệ thống. Vui lòng thử lại sau.",
      };
      const displayError = msgMap[err.message] || err.message || "Đăng nhập thất bại.";
      setError(displayError);
    } finally {
      setLoading(false);
    }
  };
  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <Input
        label="Email / Tên đăng nhập"
        placeholder="sinhvien@truonghoc.edu.vn"
        value={email}
        onValueChange={(val) => {
          setEmail(val);
          if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: "" }));
        }}
        startContent={<Envelope className="size-4 text-muted" />}
        variant="bordered"
        classNames={inputClasses}
        isRequired
        isInvalid={!!fieldErrors.email}
        errorMessage={fieldErrors.email}
      />
      <Input
        label="Mật khẩu"
        placeholder="Nhập mật khẩu"
        value={password}
        onValueChange={(val) => {
          setPassword(val);
          if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
        }}
        type={showPassword ? "text" : "password"}
        startContent={<Lock className="size-4 text-muted" />}
        endContent={
          <button type="button" className="text-muted hover:text-secondary" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        variant="bordered"
        classNames={inputClasses}
        isRequired
        isInvalid={!!fieldErrors.password}
        errorMessage={fieldErrors.password}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">{error}</p>
      )}

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

      <GoogleLogin
        onSuccess={(credentialResponse) => {
          setError("");
          navigate("/verify-otp", {
            state: {
              id_token: credentialResponse.credential,
              flow: "google",
            },
          });
        }}
        onError={() => setError("Không thể đăng nhập bằng Google.")}
      />

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onOpen}
          className="text-xs text-muted hover:text-olive transition-colors font-medium underline underline-offset-4 flex items-center justify-center gap-1 mx-auto"
        >
          <Headset className="size-3" /> Liên hệ hỗ trợ
        </button>
      </div>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        placement="center"
        backdrop="blur"
        classNames={{
          base: "border-[#e5e7eb] bg-white",
          header: "border-b-[1px] border-[#e5e7eb]",
          footer: "border-t-[1px] border-[#e5e7eb]",
          closeButton: "hover:bg-black/5 active:bg-black/10",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-primary">Trung Tâm Hỗ Trợ FScape</ModalHeader>
              <ModalBody className="py-6">
                <p className="text-sm text-secondary mb-4">
                  Nếu bạn gặp khó khăn trong việc đăng nhập hoặc tài khoản bị khóa, vui lòng liên hệ với chúng tôi qua các kênh sau:
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-olive/5 border border-olive/10">
                    <div className="w-10 h-10 rounded-full bg-olive/20 flex items-center justify-center text-olive">
                      <Envelope size={20} weight="fill" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Email hỗ trợ</p>
                      <p className="text-sm font-bold text-primary">support@fscape.vn</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-olive/5 border border-olive/10">
                    <div className="w-10 h-10 rounded-full bg-olive/20 flex items-center justify-center text-olive">
                      <Phone size={20} weight="fill" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Hotline 24/7</p>
                      <p className="text-sm font-bold text-primary">1900 8888</p>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" className="bg-olive font-bold" onPress={onClose}>
                  Đã hiểu
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </form>
  );
}
