// import { type Monthly } from "../types";
import { useEffect, useState } from "react";
import api from "../api";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

type Monthly = { month: string; debit: number; credit: number; balance: number; };

export default function MonthlyChart({ year = "2025" }: { year?: string }) {
  const [data, setData] = useState<Monthly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/reports/monthly", { params: { year } })
      .then(r => {
        const arr = Array.isArray(r.data) ? r.data : [];
        // Force numérisation pour Recharts
        setData(arr.map((d:any) => ({
          month: String(d.month ?? ""),
          debit: Number(d.debit ?? 0),
          credit: Number(d.credit ?? 0),
          balance: Number(d.balance ?? 0),
        })));
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div>Chargement…</div>;

  return (
    <div style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="debit" />
          <Line type="monotone" dataKey="credit" />
          <Line type="monotone" dataKey="balance" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

