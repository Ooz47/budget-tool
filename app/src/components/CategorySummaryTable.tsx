import { useEffect, useState, useMemo } from "react";
import api from "../api";

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
};

export default function CategorySummaryTable({ year, month }: Props) {
  const [rows, setRows] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<"debit" | "credit" | "count">("debit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 🧭 Charger les données
  useEffect(() => {
    setLoading(true);
    api
      .get<{ data: CategoryNode[] }>("/reports/by-category", { params: { year, month } })
      .then((r) => {
        setRows(r.data.data || []);
      })
      .catch((err) => {
        console.error("Erreur API /reports/by-category :", err);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  // 🔍 Filtrage simple par nom
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    const filterTree = (node: CategoryNode): CategoryNode | null => {
      const match = node.name.toLowerCase().includes(q);
      const children = node.children
        .map(filterTree)
        .filter((child): child is CategoryNode => child !== null);
      if (match || children.length > 0) {
        return { ...node, children };
      }
      return null;
    };
    return rows.map(filterTree).filter((r): r is CategoryNode => r !== null);
  }, [rows, query]);

  // ⚙️ Tri (niveau racine uniquement)
  const sortedRows = useMemo(() => {
    const data = [...filteredRows];
    data.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });
    return data;
  }, [filteredRows, sortField, sortOrder]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderRows = (nodes: CategoryNode[], level = 0): JSX.Element[] =>
    nodes.flatMap((node) => {
      const isOpen = expanded[node.id] || false;
      const hasChildren = node.children && node.children.length > 0;

      return [
        <tr key={node.id} style={{ borderBottom: "1px solid #eee" }}>
          <td
            style={{
              paddingLeft: `${level * 20}px`,
              whiteSpace: "nowrap",
              cursor: hasChildren ? "pointer" : "default",
              fontWeight: level === 0 ? 600 : 400,
              color: level === 0 ? "#111" : "#555",
            }}
            onClick={() => hasChildren && toggleExpand(node.id)}
          >
            {hasChildren && (
              <span style={{ marginRight: 6 }}>{isOpen ? "▾" : "▸"}</span>
            )}
            {node.name}
          </td>
          <td style={{ textAlign: "center" }}>{node.count}</td>
          <td style={{ textAlign: "right", color: "#dc2626" }}>
            {node.debit.toFixed(2)} €
          </td>
          <td style={{ textAlign: "right", color: "#16a34a" }}>
            {node.credit.toFixed(2)} €
          </td>
        </tr>,
        isOpen ? renderRows(node.children, level + 1) : null,
      ].flat();
    });

  const handleSort = (field: "debit" | "credit" | "count") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (loading) return <div>Chargement du résumé par catégorie...</div>;
  if (!rows.length) return <div style={{ color: "#666" }}>Aucune donnée disponible.</div>;

  return (
    <div style={{ marginTop: 40, width: "70%" }}>
      <h3>Résumé par catégorie</h3>
      <p style={{ color: "#666", marginBottom: 10 }}>
        Visualisation hiérarchique des montants par catégorie et sous-catégorie.
      </p>

      {/* 🔍 Filtre */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="🔍 Rechercher une catégorie..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "6px 10px",
            fontSize: "0.9rem",
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
      </div>

      {/* 📋 Tableau */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.9rem",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            <th style={{ textAlign: "left", padding: "4px 8px" }}>Catégorie</th>
            <th
              style={{ textAlign: "center", cursor: "pointer" }}
              onClick={() => handleSort("count")}
            >
              Nb op. {sortField === "count" && (sortOrder === "asc" ? "▲" : "▼")}
            </th>
            <th
              style={{ textAlign: "right", cursor: "pointer" }}
              onClick={() => handleSort("debit")}
            >
              Débit {sortField === "debit" && (sortOrder === "asc" ? "▲" : "▼")}
            </th>
            <th
              style={{ textAlign: "right", cursor: "pointer" }}
              onClick={() => handleSort("credit")}
            >
              Crédit {sortField === "credit" && (sortOrder === "asc" ? "▲" : "▼")}
            </th>
          </tr>
        </thead>
        <tbody>{renderRows(sortedRows)}</tbody>
      </table>
    </div>
  );
}
