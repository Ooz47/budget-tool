import { useEffect, useState } from "react";
import api from "../api";

type EntitySummary = {
  entity: string;
  count: number;
  debit: number;
  credit: number;
};

type Props = {
  year: string;
  month: string;
};

type EntitySummaryResponse = {
  data: EntitySummary[];
  missing: number;
};

export default function EntitySummaryTable({ year, month }: Props) {
  const [summary, setSummary] = useState<EntitySummaryResponse>({
    data: [],
    missing: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<EntitySummaryResponse>("/reports/by-entity", { params: { year, month } })
      .then((r) => setSummary(r.data))
      .catch((err) => {
        console.error("Erreur API /reports/by-entity :", err);
        setSummary({ data: [], missing: 0 });
      })
      .finally(() => setLoading(false));
  }, [year, month]);

if (loading) return <div>Chargement du résumé par entité...</div>;
if (!summary.data.length)
  return (
    <div style={{ color: "#666", marginTop: 12 }}>
      Aucune entité identifiée pour cette période.
      {summary.missing > 0 && (
        <div style={{ marginTop: 4 }}>
          {summary.missing} transaction
          {summary.missing > 1 ? "s" : ""} sans entité détectée.
        </div>
      )}
    </div>
  );

  return (
    <div style={{ marginTop: 30 }}>
      <h3 style={{ marginBottom: 10 }}>Résumé par entité</h3>
      <p style={{ color: "#666", marginBottom: 10 }}>
  {summary.missing > 0
    ? `${summary.missing} transaction${summary.missing > 1 ? "s" : ""} sans entité détectée`
    : "Toutes les transactions ont une entité détectée ✅"}
</p>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.9rem",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            <th style={{ textAlign: "left" }}>Entité</th>
            <th>Nb opérations</th>
            <th>Montant émis (Débit)</th>
            <th>Montant reçu (Crédit)</th>
          </tr>
        </thead>
     <tbody>
  {summary.data.map((r) => (
    <tr key={r.entity} style={{ borderBottom: "1px solid #eee" }}>
      <td>{r.entity}</td>
      <td style={{ textAlign: "center" }}>{r.count}</td>
      <td style={{ textAlign: "right", color: "#dc2626" }}>
        {r.debit.toFixed(2)} €
      </td>
      <td style={{ textAlign: "right", color: "#16a34a" }}>
        {r.credit.toFixed(2)} €
      </td>
    </tr>
  ))}
</tbody>
      </table>
    </div>
  );
}
