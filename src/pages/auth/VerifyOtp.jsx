import { useState } from "react";
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

    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let res;

            if (flow === "signup") {
                res = await api.post("/api/auth/signup/verify", {
                    email: signupEmail,
                    password: signupPassword,
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
                throw new Error("Không nhận được access token.");
            }

            if (INTERNAL_ROLES.includes(user?.role)) {
                setError("Tài khoản nội bộ không được phép đăng nhập tại đây.");
                return;
            }

            login(accessToken, user);
            navigate("/", { replace: true });
        } catch (err) {
            const msgMap = {
                "Invalid or expired OTP": "Mã OTP không hợp lệ hoặc đã hết hạn.",
                "OTP request limit exceeded (5/day)": "Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau 24 giờ.",
            };
            setError(msgMap[err?.message] || err?.message || "Xác minh thất bại.");
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
                    label="OTP Code"
                    placeholder="Nhập mã OTP"
                    value={otp}
                    onValueChange={setOtp}
                    variant="bordered"
                    isRequired
                />

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                        {error}
                    </p>
                )}

                <Button
                    type="submit"
                    isLoading={loading}
                    radius="lg"
                    className="bg-olive text-white font-semibold h-11"
                >
                    {loading ? "Đang xác minh..." : "Xác minh OTP"}
                </Button>
            </form>
        </div>
    );
}
