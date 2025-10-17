import { useEffect, useState } from "react";
import api from "../api";

type Tx = {
  id: string;
  bank: string;
  accountIban?: string | null;
  dateOperation: string;
  dateValeur?: string | null;
  label: string;
  details?: string | null;
  debit: number;
  credit: number;
  amount: number;
  yearMonth: string;
  sourceFile: string;
  categoryId?: string | null;
};

type Props = {
  year: string;
  month: string;
};

export default function TransactionsTable({ year, month }: Props) {
  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<Tx[]>("/transactions", { params: { year, month } })
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : [];
        setRows(
          arr.map((x) => ({
            ...x,
            debit: Number(x.debit ?? 0),
            credit: Number(x.credit ?? 0),
            amount: Number(x.amount ?? 0),
          }))
        );
      })
      .catch((err) => {
        console.error("Erreur API /transactions :", err);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  if (loading) return <div>Chargement des transactions...</div>;

  return (
    <div style={{ marginTop: 12 }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.9rem",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            <th style={{ textAlign: "left" }}>Date</th>
            <th style={{ textAlign: "left" }}>Libellé</th>
            <th style={{ textAlign: "left" }}>Détails</th>
            <th style={{ textAlign: "right" }}>Débit</th>
            <th style={{ textAlign: "right" }}>Crédit</th>
            <th style={{ textAlign: "right" }}>Solde</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: 8, color: "#666" }}>
                Aucune transaction trouvée pour cette période.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{r.dateOperation?.slice(0, 10)}</td>
              <td>{r.label}</td>
              <td>{r.details ?? ""}</td>
              <td style={{ textAlign: "right" }}>
                {r.debit ? r.debit.toFixed(2) : ""}
              </td>
              <td style={{ textAlign: "right" }}>
                {r.credit ? r.credit.toFixed(2) : ""}
              </td>
              <td
                style={{
                  textAlign: "right",
                  color: r.amount < 0 ? "#dc2626" : "#16a34a",
                }}
              >
                {r.amount.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
