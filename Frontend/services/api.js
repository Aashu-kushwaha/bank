const BASE_URL = 'http://localhost:3000/api'
function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  
  headers['Cache-Control'] = 'no-cache';

  const options = { method, headers, credentials: 'include' };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authAPI = {
  sendOTP: (email) =>
    request('POST', '/auth/send-otp', { email }, false),

  register: (name, email, password, otp) =>
    request('POST', '/auth/register', { name, email, password, otp }, false),

  login: (email, password) =>
    request('POST', '/auth/login', { email, password }, false),

  logout: () =>
    request('POST', '/auth/logout'),

  profile: () =>
    request('GET', '/auth/profile'),
};

// ── Accounts ─────────────────────────────────────────────────────────────────

export const accountAPI = {
  getAll: () =>
    request('GET', '/accounts'),

  getBalance: (accountId) =>
    request('GET', `/accounts/${accountId}/balance`),
};

// ── Transactions ─────────────────────────────────────────────────────────────

export const transactionAPI = {
  send: (fromAccount, toAccount, amount) =>
    request('POST', '/transaction', {
      fromAccount,
      toAccount,
      amount,
      idempotencyKey: `${fromAccount}-${toAccount}-${amount}-${Date.now()}`
    }),

  getHistory: () =>
    request('GET', '/transaction/history'),
};