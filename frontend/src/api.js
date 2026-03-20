const API_URL = '/api/v1';

let accessToken = null;

export const setToken = (token) => {
  accessToken = token;
  localStorage.setItem('access_token', token);
};

export const getToken = () => {
  if (!accessToken) {
    accessToken = localStorage.getItem('access_token');
  }
  return accessToken;
};

export const clearToken = () => {
  accessToken = null;
  localStorage.removeItem('access_token');
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
    throw new Error(error.detail || 'Ошибка запроса');
  }
  
  return response.json();
};

export const authTelegram = async (initData) => {
  const data = await request('/auth/telegram', {
    method: 'POST',
    body: JSON.stringify({ init_data: initData }),
  });
  setToken(data.access_token);
  return data;
};

export const getProfile = async () => {
  return request('/me');
};

export const scanQR = async (token) => {
  return request('/points/scan', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
};

// Admin API
export const checkAdmin = async () => {
  try {
    await request('/admin/check');
    return true;
  } catch {
    return false;
  }
};

export const getLocations = async () => {
  return request('/admin/locations');
};

export const createLocation = async (name, description, pointsReward) => {
  return request('/admin/locations', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
      points_reward: pointsReward,
    }),
  });
};

export const generateQR = async (locationId, ttlHours = null) => {
  return request(`/admin/locations/${locationId}/qr`, {
    method: 'POST',
    body: JSON.stringify({ ttl_hours: ttlHours }),
  });
};

// Leaderboard
export const getLeaderboard = async (limit = 10) => {
  return request(`/leaderboard?limit=${limit}`);
};

// Shop
export const getProducts = async () => {
  return request('/shop');
};

export const purchaseProduct = async (productId) => {
  return request('/shop/purchase', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId }),
  });
};

export const getPurchaseHistory = async () => {
  return request('/shop/purchases/history');
};
