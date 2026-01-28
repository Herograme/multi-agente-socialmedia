# Story 1.3: Frontend Shell com Vite + React

> Epic 1: Foundation & Pesquisador

---

## Story

**Como** desenvolvedor,
**Quero** uma aplicação React básica rodando,
**Para que** eu tenha a base para construir o dashboard.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Critério | Validação |
|---|----------|-----------|
| AC1 | Package `ui` com Vite + React 18 configurado | `pnpm dev:ui` inicia |
| AC2 | TypeScript strict habilitado | Sem erros de tipo |
| AC3 | Tailwind CSS configurado e funcionando | Classes utilitárias aplicadas |
| AC4 | shadcn/ui inicializado com tema dark | Componentes disponíveis |
| AC5 | React Router v6 configurado com rotas básicas | Navegação funciona |
| AC6 | Layout base com sidebar/header placeholder | UI renderiza |
| AC7 | Página inicial exibindo "Social Content Agent" + status do backend | Texto visível |
| AC8 | Script `pnpm dev:ui` funcionando com HMR | Hot reload funciona |
| AC9 | Zustand store básico configurado | Store funciona |

---

## Tasks

- [x] **Task 1:** Criar projeto Vite + React
  - [x] Inicializar Vite com template react-ts
  - [x] Configurar `vite.config.ts`
  - [x] Ajustar TypeScript strict mode

- [x] **Task 2:** Configurar Tailwind CSS
  - [x] Instalar `tailwindcss`, `postcss`, `autoprefixer`
  - [x] Criar `tailwind.config.js` com tema dark
  - [x] Criar `postcss.config.js`
  - [x] Adicionar diretivas no `globals.css`

- [x] **Task 3:** Inicializar shadcn/ui
  - [x] Criar componentes shadcn-style manualmente
  - [x] Configurar tema dark como padrão
  - [x] Adicionar componentes base: Button, Card, Badge

- [x] **Task 4:** Configurar React Router
  - [x] Instalar `react-router-dom`
  - [x] Criar estrutura de rotas em `App.tsx`
  - [x] Criar páginas: Dashboard, Execution, Posts, History, Settings

- [x] **Task 5:** Criar Layout base
  - [x] Criar `components/layout/Layout.tsx`
  - [x] Criar `components/layout/Sidebar.tsx`
  - [x] Criar `components/layout/Header.tsx`
  - [x] Implementar navegação entre rotas

- [x] **Task 6:** Configurar Zustand
  - [x] Instalar `zustand`
  - [x] Criar `stores/app.store.ts`
  - [x] Implementar estado de conexão básico

- [x] **Task 7:** Conectar com backend
  - [x] Criar `lib/api.ts` com client básico
  - [x] Exibir status do backend na página inicial
  - [x] Tratar estado offline

---

## Dev Notes

### Estrutura do Package UI

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── ui/           # shadcn components
│   ├── routes/
│   │   ├── Dashboard.tsx
│   │   ├── Posts.tsx
│   │   └── Settings.tsx
│   ├── stores/
│   │   └── app.store.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── tsconfig.json
```

### Dependências

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

### Design Tokens (Tailwind)

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0F0F12',
        foreground: '#FAFAFA',
        primary: '#6366F1',
        secondary: '#8B5CF6',
      }
    }
  }
}
```

---

## Testing

### Validações Manuais

1. `pnpm dev:ui` - Vite inicia em localhost:5173
2. Navegação entre rotas funciona
3. Tema dark aplicado
4. Status do backend exibido (ok/offline)
5. HMR funciona ao editar componentes

---

## References

- [PRD](../prd.md) - Story 1.3
- [Architecture](../architecture.md) - Frontend Architecture
- [Front-End Spec](../front-end-spec.md) - Design Tokens, Component Library

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/ui/package.json` | UI package config with React 18, Vite, Tailwind, Zustand |
| Created | `packages/ui/tsconfig.json` | TypeScript config with Vite client types |
| Created | `packages/ui/vite.config.ts` | Vite configuration with React plugin |
| Created | `packages/ui/tailwind.config.js` | Tailwind CSS dark theme config |
| Created | `packages/ui/postcss.config.js` | PostCSS config for Tailwind |
| Created | `packages/ui/index.html` | HTML entry point |
| Created | `packages/ui/src/main.tsx` | React app entry point |
| Created | `packages/ui/src/App.tsx` | App component with React Router routes |
| Created | `packages/ui/src/styles/globals.css` | Global CSS with Tailwind directives and design tokens |
| Created | `packages/ui/src/lib/utils.ts` | Utility functions (cn) |
| Created | `packages/ui/src/lib/api.ts` | API client with health check |
| Created | `packages/ui/src/stores/app.store.ts` | Zustand store for app state |
| Created | `packages/ui/src/components/layout/Layout.tsx` | Main layout with Outlet |
| Created | `packages/ui/src/components/layout/Sidebar.tsx` | Navigation sidebar |
| Created | `packages/ui/src/components/layout/Header.tsx` | Header with connection status |
| Created | `packages/ui/src/components/ui/button.tsx` | Button component (shadcn-style) |
| Created | `packages/ui/src/components/ui/card.tsx` | Card component (shadcn-style) |
| Created | `packages/ui/src/components/ui/badge.tsx` | Badge component (shadcn-style) |
| Created | `packages/ui/src/routes/Dashboard.tsx` | Dashboard page with metrics and status |
| Created | `packages/ui/src/routes/Execution.tsx` | Execution page placeholder |
| Created | `packages/ui/src/routes/Posts.tsx` | Posts page placeholder |
| Created | `packages/ui/src/routes/History.tsx` | History page placeholder |
| Created | `packages/ui/src/routes/Settings.tsx` | Settings page with config display |

### Debug Log

- Fixed TypeScript error: Added `"types": ["vite/client"]` to tsconfig.json
- Fixed ESLint error: Escaped quotes in Dashboard.tsx with `&quot;`

### Completion Notes

All acceptance criteria validated:
- AC1: UI package with Vite + React 18 configured - `pnpm dev:ui` starts on port 5173
- AC2: TypeScript strict mode enabled - typecheck passes
- AC3: Tailwind CSS configured with dark theme design tokens
- AC4: shadcn-style components created (Button, Card, Badge)
- AC5: React Router v6 with 5 routes (Dashboard, Execution, Posts, History, Settings)
- AC6: Layout with sidebar and header implemented
- AC7: Dashboard shows "Social Content Agent" and backend status check
- AC8: HMR working with Vite
- AC9: Zustand store configured with connection state

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-28 | Story created | River (SM Agent) |
| 2025-01-28 | Implementation completed | Dev Agent (YOLO mode) |
