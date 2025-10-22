import axios from "axios";

// --- Création de l’instance ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

// --- Intercepteur dynamique ---
api.interceptors.request.use((config) => {
  // 🔁 Récupère la valeur la plus fraîche directement depuis le localStorage
  const activeAccountId = localStorage.getItem("activeAccountId");

  if (activeAccountId) {
    if (config.method === "get" || config.method === "delete") {
      config.params = { ...(config.params || {}), accountId: activeAccountId };
    } else if (config.data && typeof config.data === "object") {
      config.data = { ...config.data, accountId: activeAccountId };
    }
  }

  return config;
});

export default api;
