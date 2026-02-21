const analyzeBtn = document.querySelector('#analyzeBtn');
const contentInput = document.querySelector('#content');
const themeSelect = document.querySelector('#themeSelect');
const resultSection = document.querySelector('#result');
const scoreValue = document.querySelector('#scoreValue');
const riskLevel = document.querySelector('#riskLevel');
const techniquesList = document.querySelector('#techniquesList');
const explanation = document.querySelector('#explanation');

const dominantTrend = document.querySelector('#dominantTrend');
const profileMetrics = document.querySelector('#profileMetrics');
const resetProfileBtn = document.querySelector('#resetProfileBtn');

const nextScenarioBtn = document.querySelector('#nextScenarioBtn');
const submitGuessBtn = document.querySelector('#submitGuessBtn');
const techniqueGuess = document.querySelector('#techniqueGuess');
const trainingPrompt = document.querySelector('#trainingPrompt');
const trainingScore = document.querySelector('#trainingScore');
const trainingLevel = document.querySelector('#trainingLevel');
const trainingFeedback = document.querySelector('#trainingFeedback');

const PROFILE_KEY = 'defesaCognitivaProfile';
const TRAINING_KEY = 'defesaCognitivaTraining';

const patterns = [
  { name: 'Urgência artificial', regex: /\b(agora|já|última chance|só hoje|imediatamente|antes que acabe)\b/gi, weight: 18, detail: 'Pressão temporal para reduzir reflexão.', metric: 'urgency_sensitivity_score' },
  { name: 'Ameaça e medo', regex: /\b(vais perder|perder tudo|perigo|ameaça|catástrofe|arruinado)\b/gi, weight: 22, detail: 'Ativa medo para provocar obediência rápida.', metric: 'fear_trigger_score' },
  { name: 'Autoridade sem prova', regex: /\b(especialista|autoridade|fontes secretas|garantido por|100% comprovado)\b/gi, weight: 14, detail: 'Invoca autoridade para evitar questionamento.', metric: 'authority_bias_score' },
  { name: 'Escassez manipulativa', regex: /\b(últimas vagas|restam apenas|exclusivo|limitado|só para poucos)\b/gi, weight: 16, detail: 'Escassez artificial para gerar impulso.', metric: 'urgency_sensitivity_score' },
  { name: 'Isolamento social', regex: /\b(não contes a ninguém|só tu percebes|todos estão contra ti|eles escondem)\b/gi, weight: 15, detail: 'Tenta cortar validação externa e crítica.', metric: 'emotional_volatility_index' },
  { name: 'Polarização extrema', regex: /\b(ou estás connosco ou contra nós|inimigos|traidores|destruir tudo)\b/gi, weight: 15, detail: 'Força pensamento binário e tribal.', metric: 'emotional_volatility_index' }
];

const trainingScenarios = [
  ['Se não transferires agora, a tua conta fecha hoje.', 'Urgência artificial', 1],
  ['Especialistas secretos confirmam: só este método funciona.', 'Autoridade sem prova', 1],
  ['Eles escondem tudo de ti, só nós dizemos a verdade.', 'Isolamento social', 1],
  ['Últimas vagas! Depois nunca mais volta.', 'Escassez manipulativa', 1],
  ['Se ignorares isto, vais perder toda a tua poupança.', 'Ameaça e medo', 1],
  ['Ou estás connosco ou és traidor.', 'Polarização extrema', 1],
  ['Age já! O relógio está a acabar.', 'Urgência artificial', 2],
  ['100% comprovado por autoridade internacional.', 'Autoridade sem prova', 2],
  ['Ninguém te entende como nós, não contes a mais ninguém.', 'Isolamento social', 2],
  ['Oferta exclusiva para poucos escolhidos.', 'Escassez manipulativa', 2],
  ['Se não clicares, a tua família fica em risco.', 'Ameaça e medo', 2],
  ['Eles querem destruir tudo o que és.', 'Polarização extrema', 2],
  ['Última chance, decide imediatamente!', 'Urgência artificial', 3],
  ['Fonte ultra-secreta garante retorno garantido.', 'Autoridade sem prova', 3],
  ['Todos estão contra ti; confia só em mim.', 'Isolamento social', 3],
  ['Restam apenas 2 lugares para salvar o teu futuro.', 'Escassez manipulativa', 3],
  ['Se recusares, vais arrepender-te para sempre.', 'Ameaça e medo', 3],
  ['Só há dois lados: vencedores e inimigos.', 'Polarização extrema', 3],
  ['Faz isto AGORA!!!', 'Urgência artificial', 3],
  ['Eles mentem, nós somos os únicos puros.', 'Polarização extrema', 3]
].map(([scenario_text, correct_technique, difficulty], i) => ({ id: i + 1, scenario_text, correct_technique, difficulty }));

let currentScenario = null;

function computeRisk(score) {
  if (score >= 65) return { label: 'Risco alto', className: 'high' };
  if (score >= 35) return { label: 'Risco médio', className: 'medium' };
  return { label: 'Risco baixo', className: 'low' };
}

function analyze(text) {
  const found = [];
  let score = 0;
  patterns.forEach((pattern) => {
    const matches = text.match(pattern.regex);
    if (matches?.length) {
      const localScore = Math.min(pattern.weight + (matches.length - 1) * 4, pattern.weight + 12);
      score += localScore;
      found.push({ ...pattern, occurrences: matches.length, localScore });
    }
  });
  const emphasisCount = (text.match(/[!?]{2,}/g) || []).length;
  if (emphasisCount > 0) {
    score += Math.min(10, emphasisCount * 3);
    found.push({ name: 'Exagero emocional', detail: 'Pontuação intensa (!!!, ???) para amplificar reação.', occurrences: emphasisCount, localScore: Math.min(10, emphasisCount * 3), metric: 'emotional_volatility_index' });
  }
  return { score: Math.min(100, score), found, intensity: Math.min(1, score / 100) };
}

function baseProfile() {
  return {
    user_id: 'local-user',
    urgency_sensitivity_score: 0,
    fear_trigger_score: 0,
    authority_bias_score: 0,
    financial_vulnerability_score: 0,
    emotional_volatility_index: 0,
    exposure_count: 0,
    category_count: { urgency: 0, financial: 0, political: 0, relational: 0, fear: 0 },
    last_updated: null
  };
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || baseProfile();
  } catch {
    return baseProfile();
  }
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function weightedUpdate(current, incoming, count) {
  return Number((((current * count) + incoming) / (count + 1)).toFixed(3));
}

function updateProfile(analysis, theme) {
  const profile = loadProfile();
  const count = profile.exposure_count;
  profile.exposure_count += 1;
  profile.last_updated = new Date().toISOString();
  profile.category_count[theme] = (profile.category_count[theme] || 0) + 1;

  if (theme === 'financial') {
    profile.financial_vulnerability_score = weightedUpdate(profile.financial_vulnerability_score, analysis.intensity, count);
  }

  analysis.found.forEach((item) => {
    if (!item.metric || !Object.hasOwn(profile, item.metric)) return;
    const normalized = Math.min(1, item.localScore / 30);
    profile[item.metric] = weightedUpdate(profile[item.metric], normalized, count);
  });

  saveProfile(profile);
  renderProfile(profile);
}

function renderProfile(profile) {
  const entries = [
    ['urgency_sensitivity_score', 'Sensibilidade à urgência'],
    ['fear_trigger_score', 'Trigger de medo'],
    ['authority_bias_score', 'Viés de autoridade'],
    ['financial_vulnerability_score', 'Vulnerabilidade financeira'],
    ['emotional_volatility_index', 'Volatilidade emocional']
  ];

  profileMetrics.innerHTML = '';
  let dominant = ['sem dados', 0];
  entries.forEach(([key, label]) => {
    const value = profile[key] || 0;
    if (value > dominant[1]) dominant = [label, value];
    const li = document.createElement('li');
    li.textContent = `${label}: ${(value * 100).toFixed(1)}%`;
    profileMetrics.appendChild(li);
  });

  dominantTrend.textContent = `Tendência dominante: ${dominant[1] ? dominant[0] : 'sem dados ainda'}.`;
}

function renderResult(data) {
  scoreValue.textContent = String(data.score);
  const risk = computeRisk(data.score);
  riskLevel.textContent = risk.label;
  riskLevel.className = `risk ${risk.className}`;

  techniquesList.innerHTML = '';
  if (!data.found.length) {
    techniquesList.innerHTML = '<li>Não foram encontrados sinais fortes de manipulação emocional nesta amostra textual.</li>';
  } else {
    data.found.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `${item.name} (${item.occurrences}x, +${item.localScore}): ${item.detail}`;
      techniquesList.appendChild(li);
    });
  }

  explanation.textContent = 'A análise avalia estrutura persuasiva, não verdade factual. Usa este resultado como pausa cognitiva.';
  resultSection.classList.remove('hidden');
}

function loadTraining() {
  return JSON.parse(localStorage.getItem(TRAINING_KEY) || '{"score":0,"hits":0,"attempts":0}');
}

function saveTraining(stats) {
  localStorage.setItem(TRAINING_KEY, JSON.stringify(stats));
}

function refreshTrainingLevel(stats) {
  const acc = stats.attempts ? stats.hits / stats.attempts : 0;
  const level = acc > 0.8 && stats.attempts > 8 ? 'Advanced' : acc > 0.55 && stats.attempts > 4 ? 'Intermediate' : 'Beginner';
  trainingLevel.textContent = `Nível: ${level}`;
  trainingScore.textContent = `Pontuação: ${stats.score}`;
}

function nextScenario() {
  currentScenario = trainingScenarios[Math.floor(Math.random() * trainingScenarios.length)];
  trainingPrompt.textContent = currentScenario.scenario_text;
  techniqueGuess.value = '';
}

analyzeBtn.addEventListener('click', () => {
  const text = contentInput.value.trim();
  if (!text) {
    alert('Insere um texto para análise.');
    return;
  }
  const analysis = analyze(text.toLowerCase());
  renderResult(analysis);
  updateProfile(analysis, themeSelect.value);
});

resetProfileBtn.addEventListener('click', () => {
  localStorage.removeItem(PROFILE_KEY);
  renderProfile(baseProfile());
});

nextScenarioBtn.addEventListener('click', nextScenario);

submitGuessBtn.addEventListener('click', () => {
  if (!currentScenario) {
    trainingFeedback.textContent = 'Gera primeiro um cenário.';
    return;
  }
  const stats = loadTraining();
  stats.attempts += 1;
  if (techniqueGuess.value === currentScenario.correct_technique) {
    stats.hits += 1;
    stats.score += currentScenario.difficulty * 10;
    trainingFeedback.textContent = '✅ Correto. Boa leitura estrutural.';
  } else {
    trainingFeedback.textContent = `❌ Técnica correta: ${currentScenario.correct_technique}.`;
  }
  saveTraining(stats);
  refreshTrainingLevel(stats);
});

renderProfile(loadProfile());
refreshTrainingLevel(loadTraining());
