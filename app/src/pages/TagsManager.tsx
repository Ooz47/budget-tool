import { useEffect, useState } from "react";
import {
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
  type Tag,
} from "../api/tags";

export default function TagsManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [lastActionId, setLastActionId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    color: "#999999",
  });

  // --- Charger les tags ---
  const loadTags = async () => {
    setLoading(true);
    try {
      const data = await fetchTags();
      const sorted = data.sort((a: Tag, b: Tag) => a.name.localeCompare(b.name));
      setTags(sorted);
    } catch (e) {
      console.error("Erreur chargement tags :", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  // --- Soumission du formulaire ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateTag(editing.id, form);
        setLastActionId(editing.id);
      } else {
        const newTag = await createTag(form);
        setLastActionId(newTag.id);
      }
      await loadTags();
      resetForm();
    } catch (e) {
      console.error("Erreur sauvegarde tag :", e);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditing(tag);
    setForm({
      name: tag.name,
      color: tag.color ?? "#999999",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce tag ?")) return;
    try {
      await deleteTag(id);
      setLastActionId(id);
      await loadTags();
    } catch (e) {
      console.error("Erreur suppression tag :", e);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", color: "#999999" });
  };

  // --- Interface ---
  return (
    <div style={{ display: "flex", gap: 20, padding: 20, alignItems: "flex-start" }}>
      {/* 🎛️ Formulaire à gauche */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: "0 0 320px",
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fafafa",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {editing ? "✏️ Modifier un tag" : "➕ Nouveau tag"}
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

      {/* 📋 Liste des tags à droite */}
      <div style={{ flex: 1 }}>
        <h3>🏷️ Tags existants</h3>
        {loading ? (
          <p>Chargement...</p>
        ) : tags.length === 0 ? (
          <p style={{ color: "#666" }}>Aucun tag trouvé.</p>
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
                <th style={{ width: 100 }}>Couleur</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((t) => (
                <tr
                  key={t.id}
                  style={{
                    backgroundColor:
                      t.id === lastActionId ? "rgba(37,99,235,0.1)" : "transparent",
                    transition: "background-color 0.3s ease",
                  }}
                >
                  <td style={{ padding: "6px 8px" }}>{t.name}</td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      style={{
                        backgroundColor: t.color || "#ccc",
                        width: 20,
                        height: 20,
                        display: "inline-block",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                      }}
                      title={t.color || ""}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => handleEdit(t)}
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
                      onClick={() => handleDelete(t.id)}
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
