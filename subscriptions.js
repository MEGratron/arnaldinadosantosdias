const API_BASE_URL = localStorage.getItem('apiBaseUrl') || 'http://localhost:3000';
const AUTH_TOKEN_KEY = 'defesaAuthToken';
const AUTH_USER_KEY = 'defesaAuthUser';
const GUEST_SESSION_KEY = 'defesaGuestSession';

const planSessionInfo = document.querySelector('#planSessionInfo');
const plansMessage = document.querySelector('#plansMessage');
const premiumCheckoutBtn = document.querySelector('#premiumCheckoutBtn');
const backBtn = document.querySelector('#backBtn');
const logoutBtn = document.querySelector('#logoutBtn');

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getCurrentUser() {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function getGuestSession() {
  const raw = localStorage.getItem(GUEST_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(GUEST_SESSION_KEY);
}

function setMessage(message, isError = false) {
  plansMessage.textContent = message;
  plansMessage.style.color = isError ? '#ff4d6d' : '#9ba9c2';
}

async function createCheckout() {
  const token = getToken();
  if (!token) throw new Error('Precisas de conta autenticada para ativar Premium.');

  const response = await fetch(`${API_BASE_URL}/stripe/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Não foi possível iniciar checkout Premium.');
  }
  return data;
}

premiumCheckoutBtn.addEventListener('click', async () => {
  try {
    premiumCheckoutBtn.disabled = true;
    setMessage('A preparar checkout Premium...');
    const checkout = await createCheckout();
    if (checkout.checkout_url) {
      window.location.href = checkout.checkout_url;
      return;
    }
    setMessage('Checkout criado, mas sem URL de redirecionamento.', true);
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    premiumCheckoutBtn.disabled = false;
  }
});

backBtn.addEventListener('click', () => {
  const token = getToken();
  const guest = getGuestSession();
  window.location.href = 'app.html';
});

logoutBtn.addEventListener('click', () => {
  clearSession();
  window.location.href = 'app.html';
});

(function bootstrap() {
  const user = getCurrentUser();
  const guest = getGuestSession();
  const token = getToken();

  if (user && token) {
    planSessionInfo.textContent = `Sessão ativa: ${user.email}`;
    return;
  }

  if (guest?.allowed) {
    planSessionInfo.textContent = 'Sessão convidado ativa (acesso total).';
    return;
  }

  planSessionInfo.textContent = 'Acesso livre ativo: podes usar o site sem conta.';
  setMessage('Podes navegar pelos planos livremente.');
})();
