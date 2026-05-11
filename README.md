# Frontier Aces ♠

> Aventuras de pôquer no velho oeste. Single-player tycoon com cidades, propriedades, torneios e uma identidade 100% original.

[![Tests](https://img.shields.io/badge/tests-22%2F22%20passing-brightgreen)](#testes)
[![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TS-blue)](#stack)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](#licen%C3%A7a)

**Frontier Aces** é um jogo single-player de pôquer Texas Hold'em ambientado numa fronteira fictícia de oito cidades. O jogador viaja de Coyote Bend até Corazón, sobe de reputação derrotando adversários com personalidades distintas, compra e melhora propriedades para gerar renda passiva, e tenta firmar seu nome como uma lenda. Tudo em pt-BR, com arte SVG procedural, áudio sintetizado em tempo real, e zero ativos de terceiros.

---

## Sumário

- [Demonstração rápida](#demonstração-rápida)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Setup local](#setup-local)
- [Scripts](#scripts)
- [Testes](#testes)
- [Deploy — Vercel + Render](#deploy--vercel--render)
- [Modelo de dados](#modelo-de-dados)
- [Decisões de arquitetura](#decisões-de-arquitetura)
- [Originalidade do conteúdo](#originalidade-do-conteúdo)
- [Licença](#licença)

---

## Demonstração rápida

```bash
git clone <seu-fork>
cd frontier-aces
npm install
npm run dev          # frontend em http://localhost:5173
# (opcional, em outro terminal)
npm run dev:server   # backend em http://localhost:4000
```

Sem o backend rodando, o jogo continua funcionando — todo o estado é persistido localmente via `localStorage`. O servidor só é necessário se você quiser sincronização entre dispositivos e leaderboard global.

---

## Funcionalidades

### Mecânica de pôquer
- Texas Hold'em completo: small/big blind, flop/turn/river, fold/check/call/bet/raise/all-in.
- Avaliador de mãos com todas as 9 categorias e desempates por kicker corretos (incluindo a "wheel" A-2-3-4-5).
- **Side pots** corretos quando há all-ins de stacks diferentes (chips são conservados — testado).
- Dealer button rotativo, posições de SB/BB/UTG calculadas dinamicamente.
- Engine puramente funcional (`createTable`/`startHand`/`applyAction`) — testável fora do React.

### IA com personalidades
Cada NPC tem uma das 5 personalidades, com perfis diferentes de pré-flop, frequência de bluff e agressividade:
- `tightPassive` — só joga mãos premium, raramente aumenta.
- `tightAggressive` — seletivo mas aposta forte quando entra.
- `loosePassive` — calling station: paga muito, raramente aumenta.
- `looseAggressive` — joga muitas mãos com pressão constante.
- `maniac` — caótico, blefes frequentes, all-ins inesperados.

A força da mão é estimada por uma fórmula tipo Chen no pré-flop e por categoria + draws (flush/open-ender) no pós-flop.

### Mapa e progressão
- 8 cidades originais com lore própria (Coyote Bend → Saltwash → ... → Corazón).
- 12 rotas com custos de viagem.
- Cidades desbloqueiam por reputação e bankroll mínimo.
- Avatar do jogador como ponto animado durante a viagem.

### Economia
- Bankroll (em risco nas mesas) × Banco (protegido).
- 22 propriedades (saloon, hotel, mina, rancho, teatro, ferrovia) distribuídas pelas cidades.
- 3 níveis de melhoria por propriedade — multiplicador de renda 1× → 1.5× → 2.2× → 3.2×.
- Renda diária ao "dormir" na cidade.
- Histórico das últimas 100 transações.

### UI
- Identidade visual western: paleta `oxblood` / `bronze` / `parchment` / `felt`.
- Fontes Limelight + Smokum + EB Garamond (Google Fonts, todas open license).
- Cartas e fichas em SVG original (zero arte importada).
- Avatares procedurais seedados — chapéu e tom de pele determinísticos por nome do NPC.
- Áudio sintetizado em tempo real via Web Audio API (zero MP3/WAV no bundle).
- Animações com Framer Motion, respeitando `prefers-reduced-motion`.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Build / dev server | Vite |
| Linguagem | TypeScript (modo strict) |
| Framework | React 18 |
| Estado | Zustand + middleware `persist` (localStorage) |
| Estilização | Tailwind CSS 3 |
| Animação | Framer Motion |
| Renderização do mapa | SVG nativo (sem PixiJS — escolhido para acessibilidade) |
| Áudio | Web Audio API (procedural) |
| Backend | Node + Express |
| Banco | SQLite via `better-sqlite3` |
| Testes | Vitest |

---

## Estrutura do projeto

```
frontier-aces/
├── client/                        # frontend (Vite + React)
│   ├── src/
│   │   ├── engine/                # Hold'em engine (puro TS, testado)
│   │   │   ├── deck.ts
│   │   │   ├── handEvaluator.ts
│   │   │   ├── pokerEngine.ts
│   │   │   ├── ai.ts
│   │   │   └── __tests__/
│   │   ├── data/                  # cidades, oponentes, propriedades, missões
│   │   ├── stores/                # Zustand: player, economy, map, poker
│   │   ├── services/              # audio, api, persistence
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── components/
│   │   │   ├── ui/                # Button, Modal, Coin, XpBar
│   │   │   ├── poker/             # Card, Chip, Seat, Table, ActionBar
│   │   │   ├── map/               # CityNode, RoadPath, TravelerDot
│   │   │   └── hud/               # TopBar
│   │   ├── screens/               # MainMenu, Map, City, Poker, Property, Bank
│   │   ├── types/index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
├── server/                        # backend opcional (cloud saves + leaderboard)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── saves.ts
│   │   │   └── leaderboard.ts
│   │   ├── db.ts
│   │   └── index.ts
│   └── tsconfig.json
├── docs/
└── package.json                   # workspace raiz
```

---

## Pré-requisitos

- **Node.js ≥ 18** (recomendado 20.x)
- **npm ≥ 9** (vem com Node 18+)
- Para o backend em produção: ambiente que suporte `better-sqlite3` (binários nativos) — Render funciona out-of-the-box.

---

## Setup local

```bash
# 1. Instalar dependências de todos os workspaces
npm install

# 2. (opcional) copiar variáveis de ambiente
cp client/.env.example client/.env
cp server/.env.example server/.env

# 3. Rodar tudo
npm run dev          # frontend em http://localhost:5173
npm run dev:server   # backend em http://localhost:4000 (em outro terminal)

# OU rodar os dois com hot reload em paralelo:
npm run dev:all
```

O proxy do Vite envia `/api/*` para `localhost:4000` automaticamente. Sem o backend, o cliente faz fallback silencioso e usa só `localStorage`.

---

## Scripts

Da raiz do monorepo:

| Comando | Efeito |
| --- | --- |
| `npm run dev` | Sobe o frontend (porta 5173). |
| `npm run dev:server` | Sobe o backend com `tsx watch` (porta 4000). |
| `npm run dev:all` | Sobe os dois em paralelo. |
| `npm run build` | Builda frontend + backend para produção. |
| `npm run test` | Roda a suíte de testes do engine. |
| `npm run lint` | ESLint no client. |

---

## Testes

```bash
npm run test
```

A engine de pôquer tem cobertura para os pontos críticos: avaliador de mão (todas as 9 categorias, desempates, "wheel"), criação de mesa (blinds postados, hole cards distintas), ações legais por estado, ações fora-de-turno bloqueadas, fold-out, progressão completa de streets, e **conservação de chips em side pots**. Atualmente:

```
Test Files  2 passed (2)
     Tests  22 passed (22)
```

---

## Deploy — Vercel + Render

A separação em workspaces foi feita pensando neste fluxo. O frontend é estático e deploya em qualquer CDN; o backend precisa de runtime Node.

### Frontend (Vercel)

1. Faça push do repositório para o GitHub.
2. No Vercel, **New Project** → importe o repo.
3. Configure:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
4. Adicione a variável de ambiente:
   - `VITE_API_BASE=https://SUA-URL-DO-RENDER.onrender.com/api`
5. Deploy.

### Backend (Render)

1. No Render, **New** → **Web Service** → conecte o repo.
2. Configure:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
3. Adicione um **Disk persistente** (1 GB grátis):
   - Mount path: `/var/data`
4. Variáveis de ambiente:
   - `PORT=4000` (Render injeta a real automaticamente)
   - `DB_PATH=/var/data/frontier-aces.db`
5. Deploy.

> **CORS**: o backend já liga `cors()` aberto. Se quiser restringir, edite `server/src/index.ts` passando `cors({ origin: 'https://seu-dominio.vercel.app' })`.

### Alternativa: tudo no Render (sem Vercel)

Você também pode deployar o frontend como **Static Site** no Render apontando para `client` com build `npm install && npm run build` e publish dir `dist`.

---

## Modelo de dados

### Save slot (localStorage e backend)

```ts
interface SaveSlot {
  version: 1;
  createdAt: number;
  updatedAt: number;
  player: PlayerProfile;       // nome, xp, level, reputação, stats
  economy: EconomyState;       // bankroll, banco, propriedades, dia
  map: MapState;               // cidade atual, desbloqueadas, viagem ativa
  missions: Mission[];
  achievements: string[];      // ids
}
```

### Tabelas SQLite (backend)

```sql
CREATE TABLE saves (
  player_id TEXT PRIMARY KEY,
  json_data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE leaderboard (
  player_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  reputation INTEGER NOT NULL,
  bankroll INTEGER NOT NULL,
  level INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/health` | ping |
| `GET` | `/api/saves/:playerId` | recupera save |
| `PUT` | `/api/saves/:playerId` | upsert (também atualiza leaderboard) |
| `GET` | `/api/leaderboard?limit=20` | top jogadores |

---

## Decisões de arquitetura

- **Engine puramente funcional**. Cada ação retorna um novo `TableState`, sem mutação. Permite serializar replays, testar exaustivamente e tornar o componente React idempotente.
- **Zustand em vez de Redux**. Boilerplate mínimo, suporte nativo a `persist`, e tipagem direta. Quatro stores separados (player, economy, map, poker) — só o de pôquer não persiste, porque cash games são efêmeros.
- **SVG em vez de PixiJS** para o mapa. O estilo gráfico desejado era "ilustração feita à mão" — SVG combina melhor, é acessível, e funciona com Framer Motion sem ginástica. Performance é folgada com 8 cidades + 12 rotas.
- **Áudio procedural**. O bundle não inclui MP3s. `AudioService` usa `OscillatorNode`/noise/filtros para sintetizar todos os efeitos. Resultado: zero risco de copyright e bundle ~110KB gzipped.
- **Backend opcional**. O jogo é single-player; o servidor só agrega cloud sync e leaderboard. Sem ele, `Zustand persist` no localStorage cuida de tudo. `services/api.ts` faz fallback gracioso.
- **Originalidade**. Nomes de cidades, NPCs, propriedades e o próprio "Frontier Aces" são invenções. Não há referências a marcas, séries, filmes ou jogos existentes — segurança total para publicar.

---

## Originalidade do conteúdo

Todo o conteúdo deste projeto é original:

- **Identidade visual**: paleta criada para o projeto, ilustrações de cartas/fichas/avatares geradas por SVG procedural, fundo de mapa desenhado em SVG (montanhas, dunas, cactos).
- **Fontes**: Limelight, EB Garamond e Smokum, todas do Google Fonts sob OFL (open license).
- **Texto e nomes**: "Frontier Aces", as 8 cidades, os 14 NPCs e as 22 propriedades são todos invenções para este projeto.
- **Áudio**: sintetizado em runtime — nenhum sample externo.

Você pode publicar e modificar livremente sob a licença MIT.

---

## Licença

MIT. Use, fork, modifique. Atribuição é apreciada mas não exigida.
