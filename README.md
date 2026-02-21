# Defesa Cognitiva

Aplicação para analisar padrões de manipulação emocional com autenticação de utilizador.

## Uso rápido

1. Inicia a API:
   ```bash
   npm start
   ```
2. Abre `index.html` no browser.
3. Na primeira página, faz login (ou cria conta).
4. Depois de entrar, usa a análise textual da app.

## Privacidade

- O sistema guarda apenas o mínimo necessário para funcionar.
- Evita guardar conteúdo sensível sem necessidade.
Aplicação web para sinalizar **padrões de manipulação emocional** sem fazer fact-checking.

## Features entregues

### Camada 1 — Análise textual
- Score de manipulação (0–100)
- Nível de risco (baixo/médio/alto)
- Técnicas detetadas + explicação

### Camada 2 — Perfil cognitivo pessoal (privado)
- Atualização incremental após cada análise
- Métricas locais:
  - `urgency_sensitivity_score`
  - `fear_trigger_score`
  - `authority_bias_score`
  - `financial_vulnerability_score`
  - `emotional_volatility_index`
- Dashboard com tendência dominante
- Opção para apagar perfil local

### Camada 3 — Proteção em tempo real (mínima)
- Extensão Chrome em `extension/`
- Analisa texto selecionado (ou trecho limitado da página)
- Mostra aviso discreto quando deteta urgência/manipulação

### Camada 4 — Treino cognitivo
- 20 cenários de treino
- Resposta por técnica
- Pontuação local + níveis `Beginner`, `Intermediate`, `Advanced`

## Como usar

1. Abrir `index.html` no navegador.
2. Colar texto e escolher tema.
3. Clicar em **Analisar manipulação**.
4. Ver resultado + evolução do perfil.
5. Usar módulo de treino para praticar deteção.

## Privacidade

- O perfil é guardado localmente (`localStorage`).
- Não é criado perfil clínico.
- Não armazenamos conteúdo bruto por padrão.
- O utilizador pode apagar o perfil a qualquer momento.

## Roadmap recomendado

1. Camada 2
2. Camada 3
3. Camada 4
4. API institucional
5. Multimodal
