const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Generic fetch helper with auth
async function authFetch(url, options = {}) {
  const headers = {
    ...options.headers,
    ...getAuthHeaders(),
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // If 401, clear token
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
    }
    throw new Error(error.detail || error.message || `Request failed (${response.status})`);
  }

  return response.json();
}

// --- Prediction APIs ---

export async function predictFromFile(file, topK = 3) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/predict/file?top_k=${topK}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Prediction failed');
  }

  return response.json();
}

export async function predictFromURL(url, topK = 3) {
  const response = await fetch(`${API_BASE_URL}/predict/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, top_k: topK }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Prediction failed');
  }

  return response.json();
}

export async function predictFromBase64(base64Image, topK = 3) {
  const response = await fetch(`${API_BASE_URL}/predict/base64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, top_k: topK }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Prediction failed');
  }

  return response.json();
}

// --- Breed APIs ---

export async function getBreeds(animalType, search) {
  const params = new URLSearchParams();
  if (animalType) params.append('animal_type', animalType);
  if (search) params.append('search', search);

  const response = await fetch(`${API_BASE_URL}/breeds?${params}`);
  if (!response.ok) throw new Error('Failed to fetch breeds');
  return response.json();
}

export async function getBreedDetail(breedName) {
  const response = await fetch(`${API_BASE_URL}/breeds/${encodeURIComponent(breedName)}`);
  if (!response.ok) throw new Error('Breed not found');
  return response.json();
}

export async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}

export async function getVersion() {
  const response = await fetch(`${API_BASE_URL}/version`);
  return response.json();
}

// --- Authentication APIs ---

export async function authLogin(username, password) {
  return authFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export async function authRegister(username, email, password) {
  return authFetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
}

export async function authMe() {
  return authFetch('/auth/me');
}

// --- OTP APIs ---

export async function authSendRegisterOTP(email) {
  return authFetch('/auth/send-register-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

export async function authVerifyRegisterOTP(email, otp, username, password) {
  return authFetch('/auth/verify-register-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, username, password }),
  });
}

export async function authSendLoginOTP(username, password) {
  return authFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export async function authVerifyLoginOTP(email, otp, username, password) {
  return authFetch('/auth/verify-login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, username, password }),
  });
}

// --- Admin APIs ---

export async function adminListUsers() {
  return authFetch('/admin/users');
}

export async function adminChangeRole(username, role) {
  return authFetch(`/admin/users/${encodeURIComponent(username)}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
}

export async function adminToggleUser(username, currentlyDisabled) {
  const endpoint = currentlyDisabled ? 'enable' : 'disable';
  return authFetch(`/admin/users/${encodeURIComponent(username)}/${endpoint}`, {
    method: 'POST',
  });
}

export async function adminUpdateUser(username, data) {
  return authFetch(`/admin/users/${encodeURIComponent(username)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
