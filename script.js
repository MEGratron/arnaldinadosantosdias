const analyzeBtn = document.querySelector('#analyzeBtn');
const contentInput = document.querySelector('#content');
const resultSection = document.querySelector('#result');
const scoreValue = document.querySelector('#scoreValue');
const riskLevel = document.querySelector('#riskLevel');
const techniquesList = document.querySelector('#techniquesList');
const explanation = document.querySelector('#explanation');

const patterns = [
  {
    name: 'Urgência artificial',
    regex: /\b(agora|já|última chance|só hoje|imediatamente|antes que acabe)\b/gi,
    weight: 18,
    detail: 'Pressão temporal para reduzir reflexão.'
  },
  {
    name: 'Ameaça e medo',
    regex: /\b(vais perder|perder tudo|perigo|ameaça|catástrofe|arruinado)\b/gi,
    weight: 22,
    detail: 'Ativa medo para provocar obediência rápida.'
  },
  {
    name: 'Autoridade sem prova',
    regex: /\b(especialista|autoridade|fontes secretas|garantido por|100% comprovado)\b/gi,
    weight: 14,
    detail: 'Invoca autoridade para evitar questionamento.'
  },
  {
    name: 'Escassez manipulativa',
    regex: /\b(últimas vagas|restam apenas|exclusivo|limitado|só para poucos)\b/gi,
    weight: 16,
    detail: 'Escassez artificial para gerar impulso.'
  },
  {
    name: 'Isolamento social',
    regex: /\b(não contes a ninguém|só tu percebes|todos estão contra ti|eles escondem)\b/gi,
    weight: 15,
    detail: 'Tenta cortar validação externa e crítica.'
  },
  {
    name: 'Polarização extrema',
    regex: /\b(ou estás connosco ou contra nós|inimigos|traidores|destruir tudo)\b/gi,
    weight: 15,
    detail: 'Força pensamento binário e tribal.'
  }
];

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
      found.push({
        name: pattern.name,
        detail: pattern.detail,
        occurrences: matches.length,
        localScore
      });
    }
  });

  const emphasisCount = (text.match(/[!?]{2,}/g) || []).length;
  if (emphasisCount > 0) {
    score += Math.min(10, emphasisCount * 3);
    found.push({
      name: 'Exagero emocional',
      detail: 'Pontuação intensa (!!!, ???) para amplificar reação.',
      occurrences: emphasisCount,
      localScore: Math.min(10, emphasisCount * 3)
    });
  }

  score = Math.min(100, score);
  return { score, found };
}

function renderResult(data) {
  scoreValue.textContent = String(data.score);

  const risk = computeRisk(data.score);
  riskLevel.textContent = risk.label;
  riskLevel.className = `risk ${risk.className}`;

  techniquesList.innerHTML = '';
  if (!data.found.length) {
    const li = document.createElement('li');
    li.textContent = 'Não foram encontrados sinais fortes de manipulação emocional nesta amostra textual.';
    techniquesList.appendChild(li);
  } else {
    data.found.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `${item.name} (${item.occurrences}x, +${item.localScore}): ${item.detail}`;
      techniquesList.appendChild(li);
    });
  }

  explanation.textContent =
    'A análise avalia estrutura persuasiva, não verdade factual. Use este resultado como pausa cognitiva: respira, valida fontes e decide com calma.';

  resultSection.classList.remove('hidden');
}

analyzeBtn.addEventListener('click', () => {
  const text = contentInput.value.trim();
  if (!text) {
    alert('Insere um texto para análise.');
    return;
  }

  const result = analyze(text.toLowerCase());
  renderResult(result);
});
