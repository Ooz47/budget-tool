import { useEffect, useState } from "react";
import { useActiveAccount } from "../context/ActiveAccountContext";
import api from "../api";

type Account = {
  id: string;
  name: string;
  description?: string | null;
  bankCode?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
  transactionCount?: number;
  entityConfigCount?: number;
  lastTransaction?: string | null;
};

export default function AccountsManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
//   const [lastActionId, setLastActionId] = useState<string | null>(null);
  const { activeAccountId, setActiveAccount  } = useActiveAccount();
//   const [activeAccountId, setActiveAccountId] = useState<string | null>(
//     localStorage.getItem("activeAccountId")
//   );

  const [form, setForm] = useState({
    name: "",
    description: "",
    bankCode: "",
    color: "#999999",
  });

  // --- Charger les comptes avec résumé global
  const loadAccounts = async () => {
    setLoading(true);
    try {
      const [accountsRes, summaryRes] = await Promise.all([
        api.get("/accounts"),
        api.get("/accounts/summary"),
      ]);

      // Fusionne les infos de base avec les stats du résumé
      const summaryMap = new Map(
        summaryRes.data.map((s: any) => [s.id, s])
      );

      const enriched = accountsRes.data.map((a: Account) => ({
        ...a,
        ...summaryMap.get(a.id),
      }));

      setAccounts(enriched);
    } catch (e) {
      console.error("Erreur chargement comptes :", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // --- Soumission formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/accounts/${editing.id}`, form);
        setLastActionId(editing.id);
      } else {
        const res = await api.post("/accounts", form);
        setLastActionId(res.data.id);
      }
      await loadAccounts();
      resetForm();
    } catch (e) {
      console.error("Erreur sauvegarde compte :", e);
    }
  };

  const handleEdit = (acc: Account) => {
    setEditing(acc);
    setForm({
      name: acc.name,
      description: acc.description ?? "",
      bankCode: acc.bankCode ?? "",
      color: acc.color ?? "#999999",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce compte ?")) return;
    try {
      await api.delete(`/accounts/${id}`);
      setLastActionId(id);
      await loadAccounts();
    } catch (e: any) {
      alert(e.response?.data?.error || "Erreur suppression compte");
      console.error("Erreur suppression compte :", e);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", description: "", bankCode: "", color: "#999999" });
  };

const handleSetActive = (id: string) => {
  const acc = accounts.find(a => a.id === id);
  if (acc) setActiveAccount(acc.id, acc.name);
};

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || null;

  return (
    <div style={{ display: "flex", gap: 20, padding: 20, alignItems: "flex-start" }}>
      {/* 🎛️ Formulaire à gauche */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: "0 0 380px",
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fafafa",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {editing ? "✏️ Modifier un compte" : "➕ Nouveau compte"}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label>
            Nom :
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              style={{ width: "100%", padding: 6, marginTop: 4 }}
              disabled={!!editing}
            />
          </label>

          <label>
            Description :
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ width: "100%", padding: 6, marginTop: 4 }}
            />
          </label>

          <label>
            Code banque :
            <input
              type="text"
              placeholder="ex: SG, BNP, CA..."
              value={form.bankCode}
              onChange={(e) => setForm({ ...form, bankCode: e.target.value })}
              style={{ width: "100%", padding: 6, marginTop: 4 }}
            />
          </label>

          <label>
            Couleur :
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              style={{ marginLeft: 8 }}
            />
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button
              type="submit"
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                padding: "8px 14px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {editing ? "💾 Enregistrer" : "➕ Ajouter"}
            </button>

            {editing && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  border: "1px solid #ccc",
                  background: "#f9f9f9",
                  padding: "8px 14px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </form>

      {/* 📋 Liste + mini-dashboard à droite */}
      <div style={{ flex: 1 }}>
        <h3>🏦 Comptes enregistrés</h3>

        {activeAccount && (
          <div
            style={{
              background: "#eef2ff",
              border: "1px solid #c7d2fe",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <strong>Compte actif :</strong> {activeAccount.name}{" "}
            <span style={{ color: "#666" }}>
              ({activeAccount.bankCode || "—"})
            </span>
          </div>
        )}

        {loading ? (
          <p>Chargement...</p>
        ) : accounts.length === 0 ? (
          <p style={{ color: "#666" }}>Aucun compte trouvé.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {accounts.map((a) => (
              <div
                key={a.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 12,
                  background:
                    a.id === activeAccountId ? "rgba(37,99,235,0.08)" : "white",
                  transition: "background-color 0.3s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <strong style={{ color: a.color || "#000" }}>{a.name}</strong>{" "}
                    <span style={{ color: "#555" }}>
                      ({a.bankCode || "—"})
                    </span>
                    {a.description && (
                      <div style={{ fontSize: "0.85em", color: "#666" }}>
                        {a.description}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                     onClick={() => setActiveAccount(a.id, a.name)}
                      style={{
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      style={{
                        background: "#fee2e2",
                        border: "1px solid #fca5a5",
                        color: "#b91c1c",
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      Supprimer
                    </button>
                    <button
                      onClick={() => handleSetActive(a.id)}
                      style={{
                        background:
                          a.id === activeAccountId ? "#2563eb" : "#e0e7ff",
                        color: a.id === activeAccountId ? "white" : "#1e3a8a",
                        border: "1px solid #2563eb",
                        padding: "4px 10px",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                       {a.id === activeAccountId ? "✅ Actif" : "Activer"}
                    </button>
                  </div>
                </div>

                {/* Mini-dashboard */}
                <div
                  style={{
                    marginTop: 8,
                    fontSize: "0.85em",
                    color: "#444",
                    display: "flex",
                    gap: 20,
                    flexWrap: "wrap",
                  }}
                >
                  <div>💸 {a.transactionCount || 0} transactions</div>
                  <div>
                    🕓 Dernière :{" "}
                    {a.lastTransaction
                      ? new Date(a.lastTransaction).toLocaleDateString()
                      : "Aucune"}
                  </div>
                  <div>
                    ⚙️ {a.entityConfigCount || 0} config. d’entités
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}