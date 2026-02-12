import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartupPage from "./StartupPage";
import LoginPage from "./LoginPage";
import SignUp from "./SignUp";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<StartupPage />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/signup"  element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;