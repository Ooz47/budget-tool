import api from "../api";

export type Tag = {
  id: string;
  name: string;
  color?: string | null;
};

export async function fetchTags() {
  const res = await api.get("/tags");
  return res.data;
}

export async function createTag(data: { name: string; color?: string | null }) {
  const res = await api.post("/tags", data);
  return res.data;
}

export async function updateTag(id: string, data: { name?: string; color?: string | null }) {
  const res = await api.patch(`/tags/${id}`, data);
  return res.data;
}

export async function deleteTag(id: string) {
  const res = await api.delete(`/tags/${id}`);
  return res.data;
}
