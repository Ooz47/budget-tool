import { useEffect, useState, useMemo } from "react";
import { useActiveAccount } from "../context/ActiveAccountContext";
import api from "../api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type CategoryNode = {
  id: string;
  name: string;
  debit: number;
  credit: number;
  count: number;
  children: CategoryNode[];
};

type Props = {
  year: string;
  month: string;
  mode?: "debit" | "credit"; // permet de choisir le type de montant visualisé
};

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#dc2626",
  "#7c3aed",
  "#0ea5e9",
  "#facc15",
  "#4b5563",
  "#059669",
  "#f59e0b",
];

export default function CategoryDonutChart({ year, month, mode = "debit" }: Props) {
  const [rows, setRows] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(false);
const { activeAccountId } = useActiveAccount();
  // 🧭 Charger les données
  useEffect(() => {
    
if (!activeAccountId) return; // ⛔ évite d'appeler l'API sans compte actif
    setLoading(true);
    api
      .get<{ data: CategoryNode[] }>("/reports/by-category", {
        params: { year, month },
      })
      .then((r) => setRows(r.data.data || []))
      .catch((err) => {
        console.error("Erreur API /reports/by-category :", err);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [year, month, activeAccountId]);

  // 🧮 Préparer les données (catégories racines seulement)
  const data = useMemo(() => {
    const roots = rows.filter((r) => !r.id.startsWith("uncategorized"));
    const sumField = (r: CategoryNode) => (mode === "credit" ? r.credit : r.debit);
    const total = roots.reduce((acc, r) => acc + sumField(r), 0);

    const list = roots
      .map((r) => ({
        name: r.name,
        value: parseFloat(sumField(r).toFixed(2)),
      }))
      .filter((r) => r.value > 0);

    // inclure "Non catégorisée" si existante
    const uncategorized = rows.find((r) => r.id === "uncategorized");
    if (uncategorized) {
      const val = sumField(uncategorized);
      if (val > 0) {
        list.push({ name: "Non catégorisée", value: val });
      }
    }

    // trier décroissant
    list.sort((a, b) => b.value - a.value);
    return { list, total };
  }, [rows, mode]);

  if (loading) return <p>Chargement du graphique...</p>;
  if (!data.list.length)
    return (
      <p style={{ color: "#666", marginBottom: 20 }}>
        Aucune donnée disponible pour ce mois.
      </p>
    );

  return (
    <div style={{ width: "30%", height: 320, marginTop: 20 }}>
      <h3 style={{ marginBottom: 10 }}>
        Répartition par catégorie ({mode === "credit" ? "crédits" : "débits"})
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.list}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.list.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: number) =>
              `${val.toFixed(2)} € (${((val / data.total) * 100).toFixed(1)}%)`
            }
          />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
