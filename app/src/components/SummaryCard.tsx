import { useEffect, useState } from "react";
import api from "../api";
import { ArrowUpRight, ArrowDownRight, Scale } from "lucide-react"; // icônes shadcn/lucide

type Props = {
  year: string;
  month: string;
};

export default function SummaryCard({ year, month }: Props) {
  const [data, setData] = useState({ debit: 0, credit: 0, balance: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/reports/summary", { params: { year, month } })
      .then((r) => setData(r.data))
      .catch(() => setData({ debit: 0, credit: 0, balance: 0 }))
      .finally(() => setLoading(false));
  }, [year, month]);

  if (loading) return <div>Chargement du résumé...</div>;

  const { debit, credit, balance } = data;
  const isPositive = balance >= 0;

  // Styles dynamiques
  const bg = isPositive ? "#ecfdf5" : "#fef2f2";
  const border = isPositive ? "#a7f3d0" : "#fecaca";
  const color = isPositive ? "#16a34a" : "#dc2626";

  const format = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 12,
        padding: "16px 20px",
        margin: "16px 0",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ textAlign: "center", flex: 1, minWidth: 140 }}>
        <ArrowUpRight size={20} color="#22c55e" />
        <div style={{ fontSize: 14, color: "#4b5563" }}>Crédit</div>
        <div style={{ fontWeight: "bold", fontSize: 18 }}>{format(credit)}</div>
      </div>

      <div style={{ textAlign: "center", flex: 1, minWidth: 140 }}>
        <ArrowDownRight size={20} color="#ef4444" />
        <div style={{ fontSize: 14, color: "#4b5563" }}>Débit</div>
        <div style={{ fontWeight: "bold", fontSize: 18 }}>{format(debit)}</div>
      </div>

      <div style={{ textAlign: "center", flex: 1, minWidth: 140 }}>
        <Scale size={20} color={color} />
        <div style={{ fontSize: 14, color: "#4b5563" }}>Solde</div>
        <div style={{ fontWeight: "bold", fontSize: 18, color }}>{format(balance)}</div>
      </div>
    </div>
  );
}
