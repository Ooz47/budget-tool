import { useEffect, useState } from "react";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/categories";
import CategorySelect from "../components/CategorySelect";

type Category = {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  parentCategoryId?: string | null;
  children?: Category[];
};

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: "",
    color: "#999999",
    icon: "",
    parentCategoryId: null as string | null,
  });
  const [lastActionId, setLastActionId] = useState<string | null>(null);

  // --- Charger les catégories ---
  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      const sorted = data.sort((a: Category, b: Category) =>
        a.name.localeCompare(b.name)
      );
      setCategories(sorted);
    } catch (e) {
      console.error("Erreur de chargement des catégories :", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // --- Soumission formulaire ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCategory(editing.id, form);
        setLastActionId(editing.id);
      } else {
        const newCat = await createCategory(form);
        setLastActionId(newCat.id);
      }
      await loadCategories();
      resetForm();
    } catch (e) {
      console.error("Erreur sauvegarde catégorie :", e);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      color: cat.color ?? "#999999",
      icon: cat.icon ?? "",
      parentCategoryId: cat.parentCategoryId ?? null,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try {
      await deleteCategory(id);
      setLastActionId(id);
      await loadCategories();
    } catch (e) {
      console.error("Erreur suppression catégorie :", e);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", color: "#999999", icon: "", parentCategoryId: null });
  };

  // --- Structure hiérarchique ---
  const buildTree = (cats: Category[], parentId: string | null = null): Category[] =>
    cats
      .filter((c) => c.parentCategoryId === parentId)
      .map((c) => ({
        ...c,
        children: buildTree(cats, c.id),
      }));

  const tree = buildTree(categories);

  // --- Rendu récursif ---
  const renderCategoryRow = (cat: Category, level = 0) => (
    <tr
      key={cat.id}
      style={{
        backgroundColor:
          cat.id === lastActionId ? "rgba(37,99,235,0.1)" : "transparent",
        transition: "background-color 0.3s ease",
      }}
    >
      <td style={{ paddingLeft: level * 24, whiteSpace: "nowrap" }}>
        {cat.icon && <span style={{ marginRight: 6 }}>{cat.icon}</span>}
        <span
          style={{
            backgroundColor: cat.color || "#ccc",
            width: 10,
            height: 10,
            display: "inline-block",
            borderRadius: "50%",
            marginRight: 8,
          }}
        />
        {cat.name}
      </td>
      <td style={{ textAlign: "center" }}>
        {cat.parentCategoryId ? "Sous-catégorie" : "Principale"}
      </td>
      <td style={{ textAlign: "center" }}>
        <button
          onClick={() => handleEdit(cat)}
          style={{
            background: "#f3f4f6",
            border: "1px solid #d1d5db",
            padding: "4px 8px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Modifier
        </button>
        <button
          onClick={() => handleDelete(cat.id)}
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            padding: "4px 8px",
            borderRadius: 4,
            marginLeft: 6,
            cursor: "pointer",
          }}
        >
          Supprimer
        </button>
      </td>
    </tr>
  );

  const renderTree = (nodes: Category[], level = 0): JSX.Element[] =>
    nodes.flatMap((node) => [
      renderCategoryRow(node, level),
      ...(node.children ? renderTree(node.children, level + 1) : []),
    ]);

  // --- Interface ---
  return (
    <div style={{ display: "flex", gap: 20, padding: 20, alignItems: "flex-start" }}>
      {/* 🎛️ Formulaire à gauche */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: "0 0 380px",
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fafafa",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {editing ? "✏️ Modifier une catégorie" : "➕ Nouvelle catégorie"}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label>
            Nom :
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              style={{ width: "100%", padding: 6, marginTop: 4 }}
            />
          </label>

          <label>
            Couleur :
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              style={{ marginLeft: 8 }}
            />
          </label>

          <label>
            Icône :
            <input
              type="text"
              placeholder="ex: 🚗"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              style={{ width: "100%", padding: 6, marginTop: 4 }}
            />
          </label>

          <label>
            Catégorie parente :
            <CategorySelect
              value={form.parentCategoryId}
              onChange={(val) =>
                setForm({ ...form, parentCategoryId: val || null })
              }
              excludeId={editing?.id}
            />
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button
              type="submit"
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                padding: "8px 14px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {editing ? "💾 Enregistrer" : "➕ Ajouter"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  border: "1px solid #ccc",
                  background: "#f9f9f9",
                  padding: "8px 14px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </form>

      {/* 📋 Liste des catégories à droite */}
      <div style={{ flex: 1 }}>
        <h3>📁 Catégories existantes</h3>
        {loading ? (
          <p>Chargement...</p>
        ) : categories.length === 0 ? (
          <p style={{ color: "#666" }}>Aucune catégorie trouvée.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
              background: "white",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <thead style={{ background: "#f1f5f9" }}>
              <tr>
                <th style={{ textAlign: "left", padding: "8px" }}>Nom</th>
                <th style={{ width: 160 }}>Type</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>{renderTree(tree)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
