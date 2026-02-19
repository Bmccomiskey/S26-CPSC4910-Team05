import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartupPage from "./StartupPage";
import LoginPage from "./LoginPage";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import DriverDashboard from "./DriverDashboard";
import SponsorDashboard from "./SponsorDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<StartupPage />} />
        <Route path="/login"             element={<LoginPage />} />
        <Route path="/signup"            element={<SignUp />} />
        <Route path="/forgot-password"   element={<ForgotPassword />} />
        <Route path="/driver-dashboard"  element={<DriverDashboard />} />
        <Route path="/sponsor-dashboard" element={<SponsorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
