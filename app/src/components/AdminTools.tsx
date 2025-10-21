import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function AdminTools() {
  const [loading, setLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [force, setForce] = useState(false);

  const navigate = useNavigate();

  const reanalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post(
        "/admin/reanalyze",
        {},
        { params: { dry: dryRun ? "true" : "false", force: force ? "true" : "false" } }
      );

      if (dryRun) {
        setResult(`🧪 Simulation : ${res.data.simulated} transactions à modifier`);
        console.table(res.data.preview);
      } else {
        setResult(`✅ ${res.data.updated} transactions réanalysées`);
      }
    } catch (err) {
      console.error(err);
      setResult("❌ Erreur lors de la réanalyse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 30,
        padding: 12,
        border: "1px solid #ccc",
        borderRadius: 8,
      }}
    >
      <h3>Outils d'administration</h3>

      <label style={{ display: "block", marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={dryRun}
          onChange={(e) => setDryRun(e.target.checked)}
          style={{ marginRight: 6 }}
        />
        Mode simulation (dry-run)
      </label>

      <label style={{ display: "block", marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={force}
          onChange={(e) => setForce(e.target.checked)}
          style={{ marginRight: 6 }}
        />
        Forcer la mise à jour (même si les valeurs sont identiques)
      </label>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={reanalyze}
          disabled={loading}
          style={{
            background: dryRun ? "#2563eb" : "#1e3a8a",
            color: "white",
            border: "none",
            padding: "8px 14px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {loading
            ? dryRun
              ? "Simulation en cours..."
              : "Réanalyse en cours..."
            : dryRun
            ? "Simuler la réanalyse"
            : "Réanalyser réellement"}
        </button>

        {/* 🆕 Bouton vers la gestion des catégories */}
        <button
          onClick={() => navigate("/categories")}
          style={{
            background: "#f59e0b",
            color: "white",
            border: "none",
            padding: "8px 14px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          📁 Gérer les catégories
        </button>
      </div>

      {result && (
        <p
          style={{
            marginTop: 10,
            color: result.startsWith("✅") ? "#16a34a" : "#2563eb",
          }}
        >
          {result}
        </p>
      )}
    </div>
  );
}
