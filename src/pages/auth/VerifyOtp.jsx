import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Input } from "@heroui/react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const idToken = location.state?.id_token;

    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await api.post("/api/auth/google/verify", {
                id_token: idToken,
                otp,
            });

            const accessToken = res?.access_token;
            const user = res?.user;

            if (!accessToken) {
                throw new Error("Không nhận được access token.");
            }

            login(accessToken, user);

            navigate("/", { replace: true });
        } catch (err) {
            setError(err?.message || "OTP không hợp lệ.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-muted/10">
            <form
                onSubmit={handleVerify}
                className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4"
            >
                <h2 className="text-xl font-bold text-center">Xác minh OTP</h2>

                <p className="text-sm text-center text-muted">
                    Chúng tôi đã gửi mã OTP tới email của bạn.
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