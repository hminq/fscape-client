const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Kiểm tra nếu biến môi trường chưa được load
  if (!BASE_URL) {
    console.error("VITE_API_BASE_URL is not defined! Check your .env file and restart dev server.");
    throw new Error("Lỗi cấu hình hệ thống (Thiếu API URL). Vui lòng restart FE.");
  }

  // Đảm bảo không bị double slash hoặc thiếu slash
  const url = `${BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // Chỉ redirect 401 nếu KHÔNG PHẢI là trang login hoặc yêu cầu login
  if (res.status === 401 && !endpoint.includes("login") && window.location.pathname !== "/login") {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, { method: "POST", body: JSON.stringify(data) }),
  put: (endpoint, data) => request(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};
