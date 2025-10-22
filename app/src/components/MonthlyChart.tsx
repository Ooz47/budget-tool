import { useEffect, useState } from "react";
import { useActiveAccount } from "../context/ActiveAccountContext";
import api from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Monthly = {
  month: string;
  debit: number;
  credit: number;
  balance: number;
};

type Props = {
  year: string;
  month: string;
};

export default function MonthlyChart({ year, month }: Props) {
  const [data, setData] = useState<Monthly[]>([]);
  const [loading, setLoading] = useState(false);
const { activeAccountId } = useActiveAccount();

  useEffect(() => {
    if (!activeAccountId) return; // ⛔ évite d'appeler l'API sans compte actif
    setLoading(true);
    api
      .get<Monthly[]>("/reports/monthly", { params: { year, month } })
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : [];
        setData(
          arr.map((d) => ({
            month: d.month ?? "",
            debit: -Math.abs(Number(d.debit ?? 0)), // vers le bas
            credit: Math.abs(Number(d.credit ?? 0)), // vers le haut
            balance: Number(d.balance ?? 0),
          }))
        );
      })
      .catch((err) => {
        console.error("Erreur API /reports/monthly :", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [year, month, activeAccountId]);

  if (loading) return <div>Chargement du graphique...</div>;
  if (!data.length)
    return (
      <div style={{ color: "#666", margin: "12px 0" }}>
        Aucune donnée pour {year}.
      </div>
    );

  return (
    <div style={{ height: 360 }}>
      <ResponsiveContainer key={`${year}-${month}`} width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) + " €"
            }
          />
          <Legend />

          {/* Crédit */}
          <Bar dataKey="credit" name="Crédit" fill="#86efac" />

          {/* Débit */}
          <Bar dataKey="debit" name="Débit" fill="#fca5a5" />

          {/* Solde (couleur dynamique) */}
          <Bar dataKey="balance" name="Solde">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.balance >= 0 ? "#16a34a" : "#dc2626"}
              />
            ))}
          </Bar>
             {/* <Line
            type="monotone"
            dataKey="balance"
            name="Solde"
          stroke="#162ba3ff"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          /> */}
        </BarChart>

      
      </ResponsiveContainer>
    </div>
  );
}

