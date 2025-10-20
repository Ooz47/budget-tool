import { useEffect, useState } from "react";
import api from "../api";

type Stats = {
  total: number;
  withEntity: number;
  withoutEntity: number;
  withType: number;
  withoutType: number;
  coverage: number;
};

export default function StatsSummary() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<Stats>("/reports/stats")
      .then((r) => setStats(r.data))
      .catch((err) => console.error("Erreur API /reports/stats :", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Chargement des statistiques...</div>;
  if (!stats) return null;

  const { total, withEntity, withoutEntity, coverage } = stats;

  return (
    <div
      style={{
        marginTop: 20,
        padding: "12px 16px",
        border: "1px solid #ddd",
        borderRadius: 8,
        background: "#fafafa",
        fontSize: "0.95rem",
      }}
    >
      <strong>Statistiques générales :</strong>
      <ul style={{ marginTop: 6, marginBottom: 0 }}>
        <li>Total de transactions : {total}</li>
        <li>Avec entité identifiée : {withEntity}</li>
        <li>Sans entité : {withoutEntity}</li>
        <li>
          Taux de couverture :{" "}
          <span
            style={{
              color: coverage >= 95 ? "#16a34a" : "#ca8a04",
              fontWeight: 600,
            }}
          >
            {coverage} %
          </span>
        </li>
      </ul>
    </div>
  );
}
