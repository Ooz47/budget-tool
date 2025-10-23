import axios from "axios";

// --- Création de l’instance ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

// --- Intercepteur dynamique ---
api.interceptors.request.use((config) => {
  const activeAccountId = localStorage.getItem("activeAccountId");

  if (!activeAccountId) return config;

  // ✅ Si c’est une requête GET ou DELETE → ajouter dans les params
  if (config.method === "get" || config.method === "delete") {
    config.params = { ...(config.params || {}), accountId: activeAccountId };
  }
  // ✅ Si c’est un FormData → utiliser append()
  else if (config.data instanceof FormData) {
    // éviter les doublons
    if (!config.data.has("accountId")) {
      config.data.append("accountId", activeAccountId);
    }
    // 🧠 ne pas définir Content-Type, Axios le gère
    if (config.headers) delete config.headers["Content-Type"];
  }
  // ✅ Sinon, c’est un objet JSON normal
  else if (typeof config.data === "object") {
    config.data = { ...config.data, accountId: activeAccountId };
    config.headers = {
      ...(config.headers || {}),
      "Content-Type": "application/json",
    };
  }

  return config;
});

export default api;
