import { useEffect, useState } from "react";
import api from "../api";

type TypeSummary = {
  type: string;
  count: number;
  debit: number;
  credit: number;
  net: number;
};

type Props = {
  year: string;
  month: string;
};

export default function TypeSummaryTable({ year, month }: Props) {
  const [rows, setRows] = useState<TypeSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<TypeSummary[]>("/reports/by-type", { params: { year, month } })
      .then((r) => setRows(r.data))
      .catch((err) => {
        console.error("Erreur API /reports/by-type :", err);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  if (loading) return <div>Chargement du résumé par type...</div>;
  if (!rows.length) return <div>Aucune donnée pour cette période.</div>;

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ marginBottom: 10 }}>Résumé par type d’opération</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.9rem",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            <th style={{ textAlign: "left" }}>Type</th>
            <th>Nombre</th>
            <th>Montant émis</th>
            <th>Montant reçu</th>
       
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.type} style={{ borderBottom: "1px solid #eee" }}>
              <td>{r.type}</td>
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
