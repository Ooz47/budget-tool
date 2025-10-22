import { NavLink } from "react-router-dom";
import { useActiveAccount } from "../context/ActiveAccountContext";
import { useEffect, useState } from "react";
import api from "../api"; // pour récupérer la liste des comptes
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

  //  const { activeAccountId, activeAccountName } = useActiveAccount();

   const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
const { activeAccountId, activeAccountName, setActiveAccount } = useActiveAccount();

// Charger la liste des comptes au montage
useEffect(() => {
  api.get("/accounts")
    .then(res => setAccounts(res.data))
    .catch(err => console.error("Erreur chargement comptes :", err));
}, []);

   console.log("🔍 Compte actif :", activeAccountId, activeAccountName);
if (!activeAccountId) console.warn("⚠️ Aucun compte actif");
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
      <h3 style={{ margin: 0, color: "#1e3a8a" }}>
  💰 Budget Tool
  {activeAccountName && (
    <span style={{ fontSize: "0.9rem", color: "#475569", marginLeft: 8 }}>
      — {activeAccountName}
    </span>
  )}

  {/* 🔽 Sélecteur de compte */}
  {accounts.length > 1 && (
    <select
      value={activeAccountId || ""}
      onChange={(e) => {
        const acc = accounts.find(a => a.id === e.target.value);
        if (acc) setActiveAccount(acc.id, acc.name);
      }}
      style={{
        marginLeft: 12,
        padding: "4px 6px",
        borderRadius: 6,
        border: "1px solid #ccc",
        fontSize: "0.85rem",
      }}
    >
      <option value="" disabled>Choisir un compte</option>
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  )}
</h3>

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

        <NavLink to="/accounts" style={({ isActive }) => (isActive ? activeStyle : linkStyle)}>💼 Comptes</NavLink>
      </div>
    </nav>
  );
}
