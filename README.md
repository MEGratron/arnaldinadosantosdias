# Defesa Cognitiva

Aplicação para analisar padrões de manipulação emocional e apoiar decisões com mais calma.

## Uso rápido

1. Inicia a app:
   ```bash
   npm start
   ```
2. Abre no browser:
   - `http://localhost:3000` (API)
   - `index.html` (interface web estática)

## Boas práticas de segurança

- Define segredos fortes no ambiente (ex.: chave JWT e credenciais de pagamentos).
- Nunca partilhes ficheiros `.env` ou dados locais.
- Usa HTTPS em produção.
- Limita acesso administrativo e roda a app atrás de um reverse proxy com proteção adicional.

## Privacidade

- O sistema guarda apenas o mínimo necessário para funcionar.
- Evita guardar conteúdo sensível sem necessidade.
