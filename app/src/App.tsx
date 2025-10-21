import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AdminTools from "./components/AdminTools";

import CategoriesManager from "./pages/CategoriesManager";
import EntitiesManager from "./pages/EntitiesManager";
import TagsManager from "./pages/TagsManager";
import NavBar from "./components/NavBar";



export default function App() {
  return (
    <>
      <NavBar />
      <div style={{ padding: 20 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/entities" element={<EntitiesManager />} />
          <Route path="/categories" element={<CategoriesManager />} />
          <Route path="/tags" element={<TagsManager />} />
          <Route path="/admin" element={<AdminTools />} />
        </Routes>
      </div>
    </>
  );
}
