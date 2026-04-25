import axios from "axios";
import qs from "qs";
import { BASE_URL } from "../config/api";
import { getDeviceId } from "../utils/device";
import { generateSignature } from "../utils/security";

// Apply Global Interceptor to ALL axios calls (including direct imports in components)
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Define the Interceptor Logic
const interceptor = (config) => {
  config.headers = config.headers || {};

  // Basic Headers
  config.headers["X-Device-ID"] = getDeviceId();
  config.headers["X-App-Source"] = "degreefyd-secure-web";

  // --- HMAC Signature Layer ---
  const timestamp = Math.floor(Date.now() / 1000);

  // 1. Get the base path
  let requestUrl = config.url || '';
  if (requestUrl.startsWith('http')) {
    requestUrl = requestUrl.replace(BASE_URL, '');
  }

  // 2. Append query parameters if they exist (Axios logic)
  // This is crucial! req.originalUrl on backend includes the query string.
  if (config.params && Object.keys(config.params).length > 0) {
    const queryString = qs.stringify(config.params, { addQueryPrefix: true, arrayFormat: 'brackets' });
    requestUrl += queryString;
  }

  const sig = generateSignature(config.method, requestUrl, timestamp);

  if (sig) {
    config.headers["x-signature"] = sig;
    config.headers["x-timestamp"] = timestamp;
  }

  return config;
};

// Apply to BOTH global axios (for files like student.js) and apiClient
// axios.interceptors.request.use(interceptor);
apiClient.interceptors.request.use(interceptor);

// Response interceptor for centralized error handling
apiClient.interceptors.response.use(
  (resp) => resp,
  (err) => {
    const msg = err.response?.data?.message || "";
    if (err.response?.status === 403 && msg.toLowerCase().includes("window")) {
      window.location.href = "/login?notice=" + encodeURIComponent(msg);
    }
    if (err.response?.status === 401 && msg.toLowerCase().includes("session expired")) {
      window.location.href = "/login?notice=" + encodeURIComponent(msg);
    }
    return Promise.reject(err);
  }
);

export default apiClient;
