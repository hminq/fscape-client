import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/auth/AuthPage";
import BuildingDetailPage from "./pages/BuildingDetailPage";
import BuildingRoomsPage from "./pages/BuildingRoomsPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import RoomBookingPage from "./pages/RoomBookingPage";
import RoomCheckoutPage from "./pages/RoomCheckoutPage";
import RoomPaymentPage from "./pages/RoomPaymentPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/buildings/:buildingId" element={<BuildingDetailPage />} />
      <Route path="/buildings/:buildingId/rooms" element={<BuildingRoomsPage />} />
      <Route path="/buildings/:buildingId/rooms/:roomId" element={<RoomDetailPage />} />
      <Route path="/buildings/:buildingId/rooms/:roomId/booking" element={<RoomBookingPage />} />
      <Route path="/buildings/:buildingId/rooms/:roomId/checkout" element={<RoomCheckoutPage />} />
      <Route path="/buildings/:buildingId/rooms/:roomId/payment" element={<RoomPaymentPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
