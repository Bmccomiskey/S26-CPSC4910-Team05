import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartupPage from "./StartupPage";
import LoginPage from "./LoginPage";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import AdminDashboard from "./admin-pages/AdminDashboard";

// Driver pages
import DriverDashboard from "./driver-pages/DriverDashboard";
import DriverOrders from "./driver-pages/DriverOrders";
import DriverPoints from "./driver-pages/DriverPoints";
import DriverProfile from "./driver-pages/DriverProfile";

// Sponsor pages
import SponsorDashboard from "./sponsor-pages/SponsorDashboard";
import AwardPoints from "./sponsor-pages/AwardPoints";
import SponsorManageDrivers from "./sponsor-pages/SponsorManageDrivers";
import SponsorProfile from "./sponsor-pages/SponsorProfile";

import ResetPassword from "./ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* General */}
        <Route path="/"                       element={<StartupPage />} />
        <Route path="/login"                  element={<LoginPage />} />
        <Route path="/signup"                 element={<SignUp />} />
        <Route path="/forgot-password"        element={<ForgotPassword />} />
        <Route path="/reset-password"         element={<ResetPassword />} />
        <Route path="/admin-dashboard"        element={<AdminDashboard />} />

        {/* Driver routes */}
        <Route path="/driver-dashboard"       element={<DriverDashboard />} />
        <Route path="/driver-orders"          element={<DriverOrders />} />
        <Route path="/driver-points"          element={<DriverPoints />} />
        <Route path="/driver-profile"         element={<DriverProfile />} />

        {/* Sponsor routes */}
        <Route path="/sponsor-dashboard"      element={<SponsorDashboard />} />
        <Route path="/award-points"           element={<AwardPoints />} />
        <Route path="/sponsor-manage-drivers" element={<SponsorManageDrivers />} />
        <Route path="/sponsor-profile"        element={<SponsorProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;