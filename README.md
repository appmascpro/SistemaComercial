# FARO

Plataforma comercial SaaS multi-tenant para empresas que vendem insumos, matérias-primas e produtos químicos.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth, PostgreSQL, Storage)
- **React Hook Form** + **Zod**
- **xlsx** (importação) + **@react-pdf/renderer** (PDFs)

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura de pastas

```
src/
├── app/
│   ├── (dashboard)/          # Rotas autenticadas com layout
│   │   ├── page.tsx          # Dashboard
│   │   ├── produtos/
│   │   ├── clientes/
│   │   ├── cotacoes/
│   │   ├── pedidos/
│   │   ├── amostras/
│   │   ├── rotas/
│   │   ├── comissoes/
│   │   └── configuracoes/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── layout/               # Sidebar, header, shell
│   └── ui/                   # Componentes reutilizáveis
├── config/
│   └── navigation.ts         # Menu lateral
├── lib/
│   └── utils.ts
└── types/                    # Tipos base (auth, tenant)
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com as credenciais do Supabase.

## Próximos passos

1. Configurar Supabase (schema multi-tenant)
2. Autenticação e perfis de usuário
3. Módulo de produtos com importação Excel
4. Demais módulos comerciais
