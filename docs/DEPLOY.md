# Deploy do Frontier Aces — passo a passo

Este guia te leva do zero até o jogo no ar em ~5 minutos.

---

## 1. Subir no GitHub

### Pré-requisitos
- [Git instalado](https://git-scm.com/downloads)
- Conta no [GitHub](https://github.com)

### 1.1 Criar o repositório no GitHub
1. Acesse <https://github.com/new>
2. **Repository name**: `frontier-aces`
3. Deixe **público** (Vercel faz deploy de repos privados também, mas público é mais simples no plano free)
4. **NÃO** marque "Add README", "Add .gitignore" ou "Choose license" — o projeto já tem
5. Clique em **Create repository**
6. Copie a URL que aparece na próxima tela. Será algo como:
   `https://github.com/SEU-USUARIO/frontier-aces.git`

### 1.2 Fazer o push do projeto
No terminal, dentro da pasta `frontier-aces` (depois de descompactar o zip):

```bash
git init
git add .
git commit -m "Initial commit: Frontier Aces poker tycoon"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/frontier-aces.git
git push -u origin main
```

> Se o GitHub pedir autenticação e for sua primeira vez, ele vai abrir o navegador para login. Se preferir, instale o [GitHub CLI](https://cli.github.com/) e rode `gh auth login` antes.

Pronto — código no GitHub.

---

## 2. Deploy no Vercel

O `vercel.json` em `client/vercel.json` já configura tudo. Vou te dar dois caminhos: dashboard (mais simples) e CLI.

### Caminho A — pelo dashboard (recomendado)

1. Acesse <https://vercel.com/new>
2. Faça login com GitHub (ele vai pedir autorização para acessar seus repositórios)
3. Selecione o repositório **`frontier-aces`**
4. Na tela de configuração, mude apenas uma coisa:
   - **Root Directory** → `client`

   Os outros campos (Framework Preset, Build Command, Output Directory) vão ser detectados automaticamente como Vite por causa do `vercel.json`.
5. (Opcional, só se você fizer deploy do backend depois) **Environment Variables**:
   - `VITE_API_BASE` = `https://SEU-BACKEND-NO-RENDER.onrender.com/api`
6. Clique em **Deploy**

Em ~30 segundos o jogo está no ar numa URL tipo `https://frontier-aces-xyz.vercel.app`.

### Caminho B — pela CLI

```bash
npm i -g vercel
cd frontier-aces/client
vercel              # primeira vez: faz login e deploy de preview
vercel --prod       # promove para produção
```

A CLI vai perguntar:
- "Set up and deploy?" → **yes**
- "Which scope?" → escolha sua conta
- "Link to existing project?" → **no**
- "Project name?" → `frontier-aces` (ou enter para aceitar)
- "Directory?" → **./** (já está dentro de `client`)

---

## 3. Atualizações futuras

Depois do deploy inicial, é só fazer push:

```bash
git add .
git commit -m "minha mudança"
git push
```

O Vercel detecta o push e refaz o deploy automaticamente.

---

## 4. Backend (opcional, depois)

O jogo é totalmente jogável sem backend — todo o save fica em `localStorage`. Se quiser sincronização entre dispositivos e leaderboard global, suba o `server/` no Render seguindo a seção "Deploy — Backend (Render)" do `README.md`.

---

## Solução de problemas

**"Build falhou no Vercel"**
Confira se o **Root Directory** ficou marcado como `client`. Se ficou em branco, o Vercel vai tentar buildar a raiz do monorepo e falhar.

**"npm install" falha localmente**
Tem que ser Node 18+ (use `node --version` para checar). Se for Node 16 ou anterior, atualize via [nvm](https://github.com/nvm-sh/nvm).

**"git push" pede usuário e senha mas não aceita a senha**
GitHub não aceita mais senha em HTTPS desde 2021. Use um [Personal Access Token](https://github.com/settings/tokens) no lugar da senha, ou use o [GitHub CLI](https://cli.github.com/) (`gh auth login`) que cuida disso automaticamente.
