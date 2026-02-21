const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || '';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const FREEMIUM_LIMIT_PER_DAY = Number(process.env.FREEMIUM_LIMIT_PER_DAY || 5);

const DB_FILE = path.join(__dirname, 'data.json');

function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const base = { users: [], analyses: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(base, null, 2));
  }
}

function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseJsonBuffer(rawBuffer) {
  try {
    if (!rawBuffer.length) return {};
    return JSON.parse(rawBuffer.toString('utf8'));
  } catch {
    return null;
  }
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload = { ...payload, iat: Math.floor(Date.now() / 1000) };
  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerPart}.${payloadPart}`)
    .digest('base64url');
  return `${headerPart}.${payloadPart}.${signature}`;
}

function verifyJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signature] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${headerPart}.${payloadPart}`).digest('base64url');
  if (expected !== signature) return null;
  try {
    return JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, oldHash] = stored.split(':');
  const check = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(check), Buffer.from(oldHash));
}

const patterns = [
  { name: 'Urgência artificial', regex: /\b(agora|já|última chance|só hoje|imediatamente|antes que acabe)\b/gi, weight: 18 },
  { name: 'Ameaça e medo', regex: /\b(vais perder|perder tudo|perigo|ameaça|catástrofe|arruinado)\b/gi, weight: 22 },
  { name: 'Autoridade sem prova', regex: /\b(especialista|autoridade|fontes secretas|garantido por|100% comprovado)\b/gi, weight: 14 },
  { name: 'Escassez manipulativa', regex: /\b(últimas vagas|restam apenas|exclusivo|limitado|só para poucos)\b/gi, weight: 16 }
];

function analyze(text) {
  const found = [];
  let score = 0;
  for (const pattern of patterns) {
    const matches = text.match(pattern.regex);
    if (matches?.length) {
      const localScore = Math.min(pattern.weight + (matches.length - 1) * 4, pattern.weight + 12);
      score += localScore;
      found.push({ name: pattern.name, occurrences: matches.length, localScore });
    }
  }
  score = Math.min(100, score);
  const risk = score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low';
  return { score, risk, techniques: found };
}

function getUserFromRequest(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length);
  return verifyJwt(token);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function createStripeCheckoutSession({ userId, email }) {
  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    throw new Error('Stripe env vars missing');
  }

  const form = new URLSearchParams();
  form.set('mode', 'subscription');
  form.set('success_url', `${APP_URL}/?checkout=success`);
  form.set('cancel_url', `${APP_URL}/?checkout=cancel`);
  form.set('line_items[0][price]', STRIPE_PRICE_ID);
  form.set('line_items[0][quantity]', '1');
  form.set('client_reference_id', String(userId));
  form.set('customer_email', email);
  form.set('metadata[user_id]', String(userId));

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Stripe error: ${response.status} ${body}`);
  }

  return response.json();
}

function verifyStripeSignature(rawBody, signatureHeader) {
  if (!STRIPE_WEBHOOK_SECRET || !signatureHeader) return false;
  const entries = Object.fromEntries(signatureHeader.split(',').map((x) => x.split('=')));
  const t = entries.t;
  const v1 = entries.v1;
  if (!t || !v1) return false;
  const signedPayload = `${t}.${rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(signedPayload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

function log(req, status, detail = '') {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${status}${detail ? ` | ${detail}` : ''}`);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    log(req, 200, 'ok');
    return json(res, 200, { ok: true, uptime: process.uptime() });
  }

  if (req.method === 'POST' && url.pathname === '/auth/signup') {
    const raw = await parseBody(req);
    const body = parseJsonBuffer(raw);
    if (!body) {
      log(req, 400, 'invalid json');
      return json(res, 400, { error: 'JSON inválido.' });
    }
    const { email, password } = body;
    if (!email || !password || password.length < 6) {
      log(req, 400, 'invalid signup payload');
      return json(res, 400, { error: 'Email e password válidos são obrigatórios (min 6 chars).' });
    }

    const db = readDb();
    const exists = db.users.find((u) => u.email === email.toLowerCase());
    if (exists) {
      log(req, 409, 'email exists');
      return json(res, 409, { error: 'Email já registado.' });
    }

    const user = {
      id: db.users.length ? db.users.at(-1).id + 1 : 1,
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      is_premium: false,
      created_at: new Date().toISOString()
    };
    db.users.push(user);
    writeDb(db);

    const token = signJwt({ sub: user.id, email: user.email });
    log(req, 201, `user=${user.id}`);
    return json(res, 201, { token, user: { id: user.id, email: user.email, is_premium: user.is_premium } });
  }

  if (req.method === 'POST' && url.pathname === '/auth/login') {
    const raw = await parseBody(req);
    const body = parseJsonBuffer(raw);
    if (!body) {
      log(req, 400, 'invalid json');
      return json(res, 400, { error: 'JSON inválido.' });
    }
    const { email, password } = body;

    const db = readDb();
    const user = db.users.find((u) => u.email === String(email || '').toLowerCase());
    if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
      log(req, 401, 'invalid credentials');
      return json(res, 401, { error: 'Credenciais inválidas.' });
    }

    const token = signJwt({ sub: user.id, email: user.email });
    log(req, 200, `user=${user.id}`);
    return json(res, 200, { token, user: { id: user.id, email: user.email, is_premium: user.is_premium } });
  }

  if (req.method === 'POST' && url.pathname === '/analyze') {
    const identity = getUserFromRequest(req);
    if (!identity) {
      log(req, 401, 'missing token');
      return json(res, 401, { error: 'Token inválido ou ausente.' });
    }

    const db = readDb();
    const user = db.users.find((u) => u.id === identity.sub);
    if (!user) {
      log(req, 401, 'user missing');
      return json(res, 401, { error: 'Utilizador não encontrado.' });
    }

    const raw = await parseBody(req);
    const body = parseJsonBuffer(raw);
    if (!body) {
      log(req, 400, 'invalid json');
      return json(res, 400, { error: 'JSON inválido.' });
    }
    const text = String(body.text || '').trim();
    if (!text) {
      log(req, 400, 'text missing');
      return json(res, 400, { error: 'Campo text é obrigatório.' });
    }

    const day = todayKey();
    const todayCount = db.analyses.filter((a) => a.user_id === user.id && a.day === day).length;
    if (!user.is_premium && todayCount >= FREEMIUM_LIMIT_PER_DAY) {
      log(req, 429, `freemium limit user=${user.id}`);
      return json(res, 429, { error: 'Limite freemium diário atingido.', limit: FREEMIUM_LIMIT_PER_DAY });
    }

    const result = analyze(text.toLowerCase());
    db.analyses.push({
      id: db.analyses.length ? db.analyses.at(-1).id + 1 : 1,
      user_id: user.id,
      day,
      score: result.score,
      risk: result.risk,
      created_at: new Date().toISOString()
    });
    writeDb(db);

    log(req, 200, `user=${user.id} score=${result.score}`);
    return json(res, 200, {
      ...result,
      usage: {
        today: todayCount + 1,
        limit: user.is_premium ? null : FREEMIUM_LIMIT_PER_DAY,
        is_premium: user.is_premium
      }
    });
  }

  if (req.method === 'POST' && url.pathname === '/stripe/checkout') {
    const identity = getUserFromRequest(req);
    if (!identity) {
      log(req, 401, 'missing token');
      return json(res, 401, { error: 'Token inválido ou ausente.' });
    }
    const db = readDb();
    const user = db.users.find((u) => u.id === identity.sub);
    if (!user) {
      log(req, 404, 'user not found');
      return json(res, 404, { error: 'Utilizador não encontrado.' });
    }

    try {
      const session = await createStripeCheckoutSession({ userId: user.id, email: user.email });
      log(req, 200, `checkout user=${user.id}`);
      return json(res, 200, { checkout_url: session.url, id: session.id });
    } catch (error) {
      log(req, 500, 'stripe checkout failed');
      return json(res, 500, { error: 'Erro ao criar checkout Stripe.', detail: error.message });
    }
  }

  if (req.method === 'POST' && url.pathname === '/stripe/webhook') {
    const rawBody = await parseBody(req);
    const signature = req.headers['stripe-signature'];

    if (!verifyStripeSignature(rawBody, signature)) {
      log(req, 400, 'invalid stripe signature');
      return json(res, 400, { error: 'Assinatura webhook inválida.' });
    }

    let event;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      log(req, 400, 'invalid stripe payload');
      return json(res, 400, { error: 'Payload webhook inválido.' });
    }

    if (event.type === 'checkout.session.completed') {
      const userId = Number(event.data?.object?.metadata?.user_id || event.data?.object?.client_reference_id);
      if (userId) {
        const db = readDb();
        const user = db.users.find((u) => u.id === userId);
        if (user) {
          user.is_premium = true;
          writeDb(db);
          log(req, 200, `premium enabled user=${userId}`);
        }
      }
    }

    return json(res, 200, { received: true });
  }

    log(req, 404, 'not found');
    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error('[fatal request error]', error.message);
    return json(res, 500, { error: 'Erro interno do servidor.' });
  }
});

initDb();
server.listen(PORT, () => {
  console.log(`Defesa Cognitiva API running on http://localhost:${PORT}`);
});
