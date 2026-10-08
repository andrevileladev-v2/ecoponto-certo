# ♻️ Ecoponto Certo

> Projeto Final — CS50x (Harvard University / edX)

Plataforma colaborativa inspirada no Waze para mapeamento de pontos de coleta seletiva, cooperativas e catadores. Os próprios usuários confirmam se os pontos ainda estão ativos e adicionam quais tipos de resíduo são aceitos.

---

## 🎯 Sobre o Projeto

O **Ecoponto Certo** nasceu como projeto final do CS50x, o curso introdutório de Ciência da Computação da Universidade de Harvard. Sem fins comerciais, o objetivo é facilitar o descarte correto de resíduos conectando cidadãos a pontos de coleta verificados pela comunidade.

**Principais funcionalidades:**
- Mapa interativo com filtro por tipo de resíduo (óleo de cozinha, eletrônicos, pilhas, vidro, Tetra Pak e mais)
- Confirmação comunitária se o ponto ainda está ativo
- Chat anônimo por ponto de coleta
- Dashboard com métricas de impacto ambiental
- Cadastro de empresas/cooperativas com perfil B2B
- Sugestões de melhoria reportadas pelos usuários

---

## 🗂️ Estrutura do Repositório

ecoponto-certo/
├── ecoponto-api/ # Back-end (Fastify + Prisma + Supabase)
└── ecoponto-web/ # Front-end (Next.js 14)

## 🛠️ Stack

| Camada      | Tecnologia                        |
|-------------|-----------------------------------|
| Front-end   | Next.js 14, TypeScript, MapLibre GL |
| Back-end    | Fastify, Prisma, TypeScript       |
| Banco       | Supabase (PostgreSQL + PostGIS)   |
| Mapa        | MapLibre GL + OpenStreetMap       |
| Hospedagem  | Vercel (web) + Railway (api)      |

---

## ⚙️ Como rodar localmente

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no [Supabase](https://supabase.com) (gratuito)

### 1. Clone o repositório

```bash
git clone https://github.com/andrevileladev-v2/ecoponto-certo.git
cd ecoponto-certo
```

### 2. Back-end (ecoponto-api)

```bash
cd ecoponto-api
npm install
```

Crie o arquivo `.env` na raiz de `ecoponto-api/`:

```env
DATABASE_URL=postgresql://...        # URL de conexão do Supabase
DIRECT_URL=postgresql://...          # URL direta (Prisma migrations)
PORT=3333
```

```bash
npx prisma generate
npx prisma db push
npm run dev
```

A API estará disponível em `http://localhost:3333`.

### 3. Front-end (ecoponto-web)

```bash
cd ../ecoponto-web
npm install
```

Crie o arquivo `.env.local` na raiz de `ecoponto-web/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

```bash
npm run dev
```

O app estará disponível em `http://localhost:3000`.

---

## 📄 Licença

Projeto sem fins comerciais, desenvolvido para o CS50x.  
Livre para uso educacional e não comercial.

---

*This was CS50x.*
