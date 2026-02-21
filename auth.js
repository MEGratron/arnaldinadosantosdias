const API_BASE_URL = localStorage.getItem('apiBaseUrl') || 'http://localhost:3000';
const AUTH_TOKEN_KEY = 'defesaAuthToken';
const AUTH_USER_KEY = 'defesaAuthUser';
const GUEST_SESSION_KEY = 'defesaGuestSession';

const loginTabBtn = document.querySelector('#loginTabBtn');
const signupTabBtn = document.querySelector('#signupTabBtn');
const createPageBtn = document.querySelector('#createPageBtn');
const plansPageBtn = document.querySelector('#plansPageBtn');
const authEmail = document.querySelector('#authEmail');
const authPassword = document.querySelector('#authPassword');
const authSubmitBtn = document.querySelector('#authSubmitBtn');
const guestAccessBtn = document.querySelector('#guestAccessBtn');
const authMessage = document.querySelector('#authMessage');

let authMode = 'login';

function getCurrentUser() {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function showAuthMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? '#ff4d6d' : '#9ba9c2';
}

function setAuthMode(mode) {
  authMode = mode;
  loginTabBtn.classList.toggle('active', mode === 'login');
  signupTabBtn.classList.toggle('active', mode === 'signup');
  authSubmitBtn.textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
  showAuthMessage(mode === 'login' ? 'Entra para continuar.' : 'Cria a tua conta para começar.');
}


async function authRequest(endpoint, payload) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Falha na autenticação.');
  }

  return data;
}

loginTabBtn.addEventListener('click', () => setAuthMode('login'));
signupTabBtn.addEventListener('click', () => setAuthMode('signup'));
createPageBtn.addEventListener('click', () => {
  window.location.href = 'create-profile.html';
});
plansPageBtn.addEventListener('click', () => {
  window.location.href = 'subscriptions.html';
});

authSubmitBtn.addEventListener('click', async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();

  if (!email || !password) {
    showAuthMessage('Preenche email e password.', true);
    return;
  }

  try {
    authSubmitBtn.disabled = true;
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/signup';
    const result = await authRequest(endpoint, { email, password });
    setSession(result.token, result.user);
    window.location.href = 'app.html';
  } catch (error) {
    showAuthMessage(error.message, true);
  } finally {
    authSubmitBtn.disabled = false;
  }
});


guestAccessBtn.addEventListener('click', () => {
  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify({
    allowed: true,
    unlimited: true,
    mode: 'guest-open-access',
    createdAt: new Date().toISOString()
  }));
  showAuthMessage('Entraste como convidado com acesso total.');
  window.location.href = 'app.html';
});

if (getCurrentUser() || localStorage.getItem(GUEST_SESSION_KEY)) {
  window.location.href = 'app.html';
} else {
  setAuthMode('login');
}
