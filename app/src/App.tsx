import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AdminTools from "./components/AdminTools";

import CategoriesManager from "./pages/CategoriesManager";
import NavBar from "./components/NavBar";



export default function App() {
  return (
    <>
      <NavBar />
      <div style={{ padding: 20 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<CategoriesManager />} />
          <Route path="/admin" element={<AdminTools />} />
        </Routes>
      </div>
    </>
  );
}
