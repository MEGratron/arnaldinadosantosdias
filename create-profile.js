const API_BASE_URL = localStorage.getItem('apiBaseUrl') || 'http://localhost:3000';
const AUTH_TOKEN_KEY = 'defesaAuthToken';
const AUTH_USER_KEY = 'defesaAuthUser';

const newName = document.querySelector('#newName');
const newEmail = document.querySelector('#newEmail');
const newPassword = document.querySelector('#newPassword');
const confirmPassword = document.querySelector('#confirmPassword');
const createProfileBtn = document.querySelector('#createProfileBtn');
const backToLoginBtn = document.querySelector('#backToLoginBtn');
const createProfileMessage = document.querySelector('#createProfileMessage');

function setSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function showMessage(message, isError = false) {
  createProfileMessage.textContent = message;
  createProfileMessage.style.color = isError ? '#ff4d6d' : '#9ba9c2';
}

async function signup(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Não foi possível criar o perfil.');
  }

  return data;
}

createProfileBtn.addEventListener('click', async () => {
  const name = newName.value.trim();
  const email = newEmail.value.trim();
  const password = newPassword.value.trim();
  const confirm = confirmPassword.value.trim();

  if (!name) return showMessage('O nome é obrigatório.', true);
  if (!email || !password || !confirm) return showMessage('Preenche todos os campos.', true);
  if (password.length < 6) return showMessage('A password deve ter pelo menos 6 caracteres.', true);
  if (password !== confirm) return showMessage('As passwords não coincidem.', true);

  try {
    createProfileBtn.disabled = true;
    showMessage('A criar perfil...');
    const result = await signup(email, password);
    setSession(result.token, { ...result.user, name });
    window.location.href = 'app.html';
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    createProfileBtn.disabled = false;
  }
});

backToLoginBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});
