import api from "../api";
// import api from "./index"; // ton axios.create({ baseURL: import.meta.env.VITE_API_BASE })

export async function fetchCategories() {
  const res = await api.get("/categories");
  return res.data;
}

export async function createCategory(data: {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  parentCategoryId?: string | null;
}) {
  const res = await api.post("/categories", data);
  return res.data;
}

export async function updateCategory(id: string, data: {
  name?: string;
  color?: string;
  icon?: string;
  description?: string;
  parentCategoryId?: string | null;
}) {
  const res = await api.patch(`/categories/${id}`, data); // 👈 PATCH, pas PUT
  return res.data;
}

export async function deleteCategory(id: string) {
  const res = await api.delete(`/categories/${id}`);
  return res.data;
}
