import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Input } from "@heroui/react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const INTERNAL_ROLES = ["ADMIN", "BUILDING_MANAGER", "STAFF"];

export default function VerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const flow = location.state?.flow || "google";
    const idToken = location.state?.id_token;
    const signupEmail = location.state?.email;
    const signupPassword = location.state?.password;
    const fullName = location.state?.fullName;

    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [resending, setResending] = useState(false);
    const initialSent = useRef(false);

    useEffect(() => {
        const sendInitialOtp = async () => {
            if (flow === "google" && !initialSent.current && idToken) {
                initialSent.current = true;
                try {
                    await api.post("/api/auth/google", { id_token: idToken });
                } catch (err) {
                    setError(err?.message || "Không thể gửi OTP cho Google Sign In.");
                }
            }
        };
        sendInitialOtp();
    }, [flow, idToken]);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleResend = async () => {
        setError("");
        setSuccessMsg("");
        setResending(true);
        try {
            if (flow === "signup") {
                await api.post("/api/auth/signup", { email: signupEmail, password: signupPassword });
            } else if (flow === "google") {
                await api.post("/api/auth/google", { id_token: idToken });
            } else if (flow === "forgot-password") {
                await api.post("/api/auth/forgot-password", { email: signupEmail });
            }
            setTimeLeft(300);
            setSuccessMsg("Đã gửi lại mã OTP thành công. Vui lòng kiểm tra email.");
        } catch (err) {
            setError(err?.message || "Không thể gửi lại OTP. Vui lòng thử lại sau.");
        } finally {
            setResending(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setLoading(true);

        try {
            let res;

            if (flow === "signup") {
                res = await api.post("/api/auth/signup/verify", {
                    email: signupEmail,
                    password: signupPassword,
                    fullName,
                    otp,
                });

                // verifySignup returns user object (no access_token)
                // Auto-login after signup by calling appLogin
                const loginRes = await api.post("/api/auth/app/login", {
                    email: signupEmail,
                    password: signupPassword,
                });

                login(loginRes.access_token, loginRes.user);
                navigate("/", { replace: true });
                return;
            }

            // Google flow
            res = await api.post("/api/auth/google/verify", {
                id_token: idToken,
                otp,
            });

            const accessToken = res?.access_token;
            const user = res?.user;

            if (!accessToken) {
                throw new Error("Không nhận được access token gắn liền với tài khoản.");
            }

            if (INTERNAL_ROLES.includes(user?.role)) {
                setError("Tài khoản nội bộ không được phép đăng nhập tại đây.");
                return;
            }

            login(accessToken, user);
            navigate("/", { replace: true });
        } catch (err) {
            const msgMap = {
                "Invalid or expired OTP": "Mã OTP không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại.",
                "OTP request limit exceeded (5/day)": "Bạn đã vượt quá số lần nhận OTP trong ngày (5 lần/ngày). Vui lòng thử lại sau.",
                "Google account already linked to another user": "Tài khoản Google này đã được liên kết với một tài khoản khác.",
                "User account is deactivated": "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.",
                "Account not found": "Không tìm thấy tài khoản để xác minh.",
            };
            
            let displayError = "Xác minh thất bại. Xin thử lại.";
            const errorMsg = err?.message || "";

            if (errorMsg.includes("Invalid credentials") || errorMsg.includes("Invalid or expired")) {
                displayError = msgMap["Invalid or expired OTP"];
            } else if (errorMsg.includes("limit exceeded")) {
                displayError = msgMap["OTP request limit exceeded (5/day)"];
            } else if (msgMap[errorMsg]) {
                displayError = msgMap[errorMsg];
            } else if (err.data && err.data.message) {
                displayError = err.data.message;
            } else if (errorMsg) {
                displayError = errorMsg;
            }
            
            setError(displayError);
        } finally {
            setLoading(false);
        }
    };

    const title = flow === "signup" ? "Xác minh Email" : "Xác minh OTP";
    const description = flow === "signup"
        ? `Chúng tôi đã gửi mã OTP tới ${signupEmail}.`
        : "Chúng tôi đã gửi mã OTP tới email của bạn.";

    return (
        <div className="flex justify-center items-center min-h-screen bg-muted/10">
            <form
                onSubmit={handleVerify}
                className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4"
            >
                <h2 className="text-xl font-bold text-center">{title}</h2>

                <p className="text-sm text-center text-muted">
                    {description}
                </p>

                <Input
                    label="Mã OTP"
                    placeholder="Nhập mã 6 chữ số"
                    value={otp}
                    onValueChange={(val) => {
                        // Allow only up to 6 digits
                        const numericVal = val.replace(/[^0-9]/g, "");
                        if (numericVal.length <= 6) {
                            setOtp(numericVal);
                            setError("");
                        }
                    }}
                    variant="bordered"
                    isRequired
                    maxLength={6}
                    classNames={{
                        base: "data-[has-value=true]:border-olive transition-colors",
                        inputWrapper: "border-2 data-[hover=true]:border-olive group-data-[focus=true]:border-olive group-data-[focus=true]:bg-olive/5 data-[has-value=true]:border-olive",
                        input: "tracking-[0.8em] text-center font-bold text-sm text-olive placeholder:text-muted/50",
                    }}
                />

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                        {error}
                    </p>
                )}

                {successMsg && (
                    <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                        {successMsg}
                    </p>
                )}

                <Button
                    type="submit"
                    isLoading={loading}
                    radius="lg"
                    className="bg-olive text-white font-semibold h-11 disabled:opacity-50 transition-all duration-300 shadow-md"
                    isDisabled={otp.length !== 6 || timeLeft <= 0}
                >
                    {loading ? "Đang xác minh..." : "Xác minh OTP"}
                </Button>

                <div className="mt-4 text-center pb-2">
                    {timeLeft > 0 ? (
                        <p className="text-sm text-muted mb-2">
                            Mã OTP còn hạn trong: <span className="font-bold text-olive">{formatTime(timeLeft)}</span>
                        </p>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-sm text-red-500 font-medium">Mã OTP đã hết hạn</p>
                            <Button
                                type="button"
                                variant="light"
                                className="text-olive font-semibold hover:text-olive/80 underline decoration-olive underline-offset-4"
                                onPress={handleResend}
                                isLoading={resending}
                            >
                                Gửi lại mã OTP
                            </Button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
