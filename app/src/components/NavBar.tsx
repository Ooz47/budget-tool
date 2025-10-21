import { NavLink } from "react-router-dom";

export default function NavBar() {
  const linkStyle: React.CSSProperties = {
    padding: "8px 14px",
    textDecoration: "none",
    color: "#1e293b",
    fontWeight: 500,
    borderRadius: 6,
    transition: "background 0.2s ease",
  };

  const activeStyle: React.CSSProperties = {
    ...linkStyle,
    backgroundColor: "#2563eb",
    color: "white",
  };

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <h3 style={{ margin: 0, color: "#1e3a8a" }}>💰 Budget Tool</h3>
      <div style={{ display: "flex", gap: "8px" }}>
        <NavLink
          to="/"
          style={({ isActive }) => (isActive ? activeStyle : linkStyle)}
        >
          📊 Tableau de bord
        </NavLink>

        <NavLink
          to="/categories"
          style={({ isActive }) => (isActive ? activeStyle : linkStyle)}
        >
          📁 Catégories
        </NavLink>

           <NavLink
          to="/tags"
          style={({ isActive }) => (isActive ? activeStyle : linkStyle)}
        >
          🏷️ Tags
        </NavLink>

            <NavLink
          to="/entities"
          style={({ isActive }) => (isActive ? activeStyle : linkStyle)}
        >
          🏦 Entités
        </NavLink>

        <NavLink
          to="/admin"
          style={({ isActive }) => (isActive ? activeStyle : linkStyle)}
        >
          ⚙️ Outils
        </NavLink>
      </div>
    </nav>
  );
}
