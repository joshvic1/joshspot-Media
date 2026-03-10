import axios from "axios";

const API = axios.create({
  baseURL: "https://joshspot-media-backend-production.up.railway.app/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("adminToken");

  if (token) {
    req.headers.authorization = token;
  }

  return req;
});

export default API;
