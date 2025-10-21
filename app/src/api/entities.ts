import api from "../api";

export type Entity = {
  id: string;
  name: string;
  displayName?: string | null;
  aliasOfId?: string | null;
  aliasOf?: { id: string; name: string; displayName?: string | null } | null;
  aliases?: { id: string; name: string; displayName?: string | null }[];
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  tags?: { tag: { id: string; name: string; color?: string | null } }[];
};

export async function fetchEntities() {
  const res = await api.get("/entities");
  return res.data;
}

export async function createEntity(data: {
  name: string;
  categoryId?: string | null;
  tagIds?: string[];
}) {
  const res = await api.post("/entities", data);
  return res.data;
}

export async function updateEntity(
  id: string,
  data: {
    name?: string;
    categoryId?: string | null;
    aliasOfId?: string | null;
    tagIds?: string[];
  }
) {
  const res = await api.patch(`/entities/${id}`, data);
  return res.data;
}

export async function deleteEntity(id: string) {
  const res = await api.delete(`/entities/${id}`);
  return res.data;
}

// ✅ Met à jour uniquement le nom d'affichage
export async function updateEntityDisplayName(id: string, displayName: string | null) {
  const res = await api.patch(`/entities/${id}/display`, { displayName });
  return res.data;
}