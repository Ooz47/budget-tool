import { useEffect, useState } from "react";
import {
  fetchEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  type Entity,
} from "../api/entities";
import { fetchTags } from "../api/tags"; // à créer
import CategorySelect from "../components/CategorySelect";
// import Select from "react-select";
import TagSelect from "../components/TagSelect";
import AliasSelect from "../components/AliasSelect";

// --- Types auxiliaires ---
type Tag = { id: string; name: string; color?: string | null };

// --- Composant principal ---
export default function EntitiesManager() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [lastActionId, setLastActionId] = useState<string | null>(null);
const [showAliasModal, setShowAliasModal] = useState(false);
const [form, setForm] = useState({
  name: "",
  displayName: "",
  categoryId: null as string | null,
  tagIds: [] as string[],
});


  // --- Charger les entités et tags ---
  const loadEntities = async () => {
    setLoading(true);
    try {
      const data = await fetchEntities();
      setEntities(data);
    } catch (e) {
      console.error("Erreur de chargement des entités :", e);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const res = await fetchTags();
      setTags(res);
    } catch (e) {
      console.error("Erreur de chargement des tags :", e);
    }
  };

  useEffect(() => {
    loadEntities();
    loadTags();
  }, []);

  // --- Soumission formulaire ---
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    if (editing) {
      // 1️⃣ Met à jour les infos principales
      await updateEntity(editing.id, {
        categoryId: form.categoryId,
        tagIds: form.tagIds,
      });

      // 2️⃣ Met à jour le displayName séparément
      await updateEntityDisplayName(editing.id, form.displayName || null);

      setLastActionId(editing.id);
    } else {
      // Création nouvelle entité
      const newEntity = await createEntity({
        name: form.name.trim() || form.displayName.trim(),
        categoryId: form.categoryId,
        tagIds: form.tagIds,
      });
      // On ajoute le displayName juste après création si besoin
      if (form.displayName.trim() && newEntity?.id) {
        await updateEntityDisplayName(newEntity.id, form.displayName);
      }
      setLastActionId(newEntity.id);
    }

    await loadEntities();
    resetForm();
  } catch (e) {
    console.error("Erreur sauvegarde entité :", e);
  }
};


  const handleEdit = (ent: Entity) => {
    setEditing(ent);
setForm({
  name: ent.name,
  displayName: ent.displayName ?? "",
  categoryId: ent.categoryId ?? null,
  tagIds: ent.tags?.map((t) => t.tag.id) || [],
});
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette entité ?")) return;
    try {
      await deleteEntity(id);
      setLastActionId(id);
      await loadEntities();
    } catch (e) {
      console.error("Erreur suppression entité :", e);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", categoryId: null, tagIds: [] });
  };

  // --- Interface ---
  return (
    <div style={{ display: "flex", gap: 20, padding: 20, alignItems: "flex-start" }}>
      {/* 🎛️ Formulaire à gauche */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: "0 0 400px",
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fafafa",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {editing ? "✏️ Modifier une entité" : "➕ Nouvelle entité"}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label>
  Nom d’origine :
  <input
    type="text"
    value={form.name}
    readOnly
    style={{
      width: "100%",
      padding: 6,
      marginTop: 4,
      background: "#f3f4f6",
      border: "1px solid #ddd",
      color: "#666",
      cursor: "not-allowed",
    }}
  />
</label>

{/* Nom d’affichage (modifiable) */}
<label>
  Nom d’affichage :
  <input
    type="text"
    placeholder="ex: Orange"
    value={form.displayName}
    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
    style={{ width: "100%", padding: 6, marginTop: 4 }}
  />
</label>

          <label>
            Catégorie :
            <CategorySelect
              value={form.categoryId}
              onChange={(val) => setForm({ ...form,   categoryId: (Array.isArray(val) ? val[0] : val) || null, })}
            />
          </label>

     <label>
  Tags :
  <TagSelect
    value={form.tagIds}
    onChange={(newTags) => setForm({ ...form, tagIds: newTags })}
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

         {editing && (
  <button
    type="button"
    onClick={() => setShowAliasModal(true)}
    style={{
      border: "1px solid #ccc",
      background: "#eef2ff",
      color: "#1e3a8a",
      padding: "8px 14px",
      borderRadius: 6,
      cursor: "pointer",
      width: "100%",
      marginTop: 6,
    }}
  >
    🔗 Gérer les alias
  </button>
)}
          </div>
        </div>
      </form>

      {/* 📋 Liste des entités à droite */}
      <div style={{ flex: 1 }}>
        <h3>🏷️ Entités existantes</h3>
        {loading ? (
          <p>Chargement...</p>
        ) : entities.length === 0 ? (
          <p style={{ color: "#666" }}>Aucune entité trouvée.</p>
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
                <th style={{ width: 180 }}>Catégorie</th>
                <th style={{ width: 220 }}>Tags</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((ent) => (
                <tr
                  key={ent.id}
                  style={{
                    backgroundColor:
                      ent.id === lastActionId
                        ? "rgba(37,99,235,0.1)"
                        : "transparent",
                    transition: "background-color 0.3s ease",
                  }}
                >
<td style={{ padding: "6px 8px", verticalAlign: "top" }}>
  <div>
    {ent.displayName ? (
      <>
        <strong>{ent.displayName}</strong>
        <span style={{ color: "#777", fontSize: "0.8em" }}> ({ent.name})</span>
      </>
    ) : (
      ent.name
    )}
  </div>

  {/* 🧩 Indicateur alias */}
  {ent.aliasOf ? (
    <div style={{ fontSize: "0.8em", color: "#555", marginTop: 2 }}>
      ↳ alias de{" "}
      <span style={{ fontStyle: "italic" }}>
        {ent.aliasOf.displayName || ent.aliasOf.name}
      </span>
    </div>
  ) : ent.aliases && ent.aliases.length > 0 ? (
    <div style={{ fontSize: "0.8em", color: "#2563eb", marginTop: 2 }}>
      🔗 {ent.aliases.length} alias lié{ent.aliases.length > 1 ? "s" : ""}
    </div>
  ) : null}
</td>
                  <td style={{ textAlign: "center" }}>
                    {ent.category?.name || "-"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {ent.tags?.length ? (
                      ent.tags.map((t) => (
                        <span
                          key={t.tag.id}
                          style={{
                            backgroundColor: t.tag.color || "#e5e7eb",
                            color: "#111",
                            padding: "2px 6px",
                            borderRadius: 4,
                            margin: "0 2px",
                            fontSize: "0.8em",
                            display: "inline-block",
                          }}
                        >
                          {t.tag.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "#999" }}>–</span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => handleEdit(ent)}
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
                      onClick={() => handleDelete(ent.id)}
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
        {showAliasModal && editing && (
  <AliasSelect
    entityId={editing.id}
    onClose={() => setShowAliasModal(false)}
    onUpdated={loadEntities}
  />
)}
    </div>
    
  );



}
