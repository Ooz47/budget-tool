import { useEffect, useState, useMemo, useRef } from "react";
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

  const [sortField, setSortField] = useState<keyof EntitySummary>("debit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  // 🧭 Référence pour le scroll
  const tableRef = useRef<HTMLDivElement>(null);

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

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return summary.data;
    return summary.data.filter((r) => r.entity.toLowerCase().includes(q));
  }, [summary.data, query]);

  const sortedRows = useMemo(() => {
    const data = [...filteredRows];
    data.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA ?? "").toUpperCase();
      const strB = String(valB ?? "").toUpperCase();
      if (strA < strB) return sortOrder === "asc" ? -1 : 1;
      if (strA > strB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredRows, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const paginatedRows = sortedRows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleSort = (field: keyof EntitySummary) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      // 🧭 Scroll automatique vers le tableau
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
    <div ref={tableRef} style={{ marginTop: 30 }}>
      <h3 style={{ marginBottom: 10 }}>Résumé par entité</h3>
      <p style={{ color: "#666", marginBottom: 10 }}>
        {summary.missing > 0
          ? `${summary.missing} transaction${
              summary.missing > 1 ? "s" : ""
            } sans entité détectée`
          : "Toutes les transactions ont une entité détectée ✅"}
      </p>

      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="🔍 Rechercher une entité..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          style={{
            width: "100%",
            padding: "6px 10px",
            fontSize: "0.9rem",
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
      </div>

      {/* Tableau */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.9rem",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            {[
              ["entity", "Entité"],
              ["count", "Nb opérations"],
              ["debit", "Montant émis (Débit)"],
              ["credit", "Montant reçu (Crédit)"],
            ].map(([key, label]) => (
              <th
                key={key}
                onClick={() => handleSort(key as keyof EntitySummary)}
                style={{
                  cursor: "pointer",
                  padding: "4px 8px",
                  textAlign:
                    key === "debit" || key === "credit" ? "right" : "left",
                  userSelect: "none",
                }}
              >
                {label}{" "}
                {sortField === key && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {paginatedRows.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{ textAlign: "center", padding: 8, color: "#666" }}
              >
                Aucune entité trouvée.
              </td>
            </tr>
          ) : (
            paginatedRows.map((r) => (
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
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            style={{
              padding: "4px 8px",
              border: "1px solid #ccc",
              borderRadius: 4,
              background: page === 1 ? "#f3f3f3" : "white",
              cursor: page === 1 ? "not-allowed" : "pointer",
            }}
          >
            ◀
          </button>

          <span style={{ lineHeight: "24px" }}>
            Page {page} / {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            style={{
              padding: "4px 8px",
              border: "1px solid #ccc",
              borderRadius: 4,
              background: page === totalPages ? "#f3f3f3" : "white",
              cursor: page === totalPages ? "not-allowed" : "pointer",
            }}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}
