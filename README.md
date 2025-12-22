# Backend - Anka MFO Platform

API REST construída com **Fastify 5.1.0**, **TypeScript 5.3.3** e **PostgreSQL 17**.

## 🚀 Quick Start

### Option 1: Docker (Recomendado)

```bash
# Clone o repositório infra (contém docker-compose)
git clone https://github.com/m6rc0sp/anka-mfo-infra.git
cd anka-mfo-infra

# Inicie todos os serviços
docker compose up -d

# Verificar logs
docker compose logs -f backend

# Rodar testes
docker compose exec backend npm test

# Acessar API: http://localhost:3333
# Swagger:     http://localhost:3333/docs
```

### Option 2: Local (Node.js 24+)

```bash
# Clone apenas o backend
git clone https://github.com/m6rc0sp/anka-mfo-backend.git
cd anka-mfo-backend

# Instale dependências
npm install

# Configure environment
cp .env.example .env

# Inicie PostgreSQL (outro terminal ou Docker)
docker run --name postgres -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 postgres:17

# Rode servidor
npm run dev

# Em outro terminal, rodar testes
npm test
```

## 📦 Instalação

### Pré-requisitos
- Node.js 24+ LTS
- PostgreSQL 17+ (local ou Docker)
- npm 10+

### Passos

```bash
git clone https://github.com/m6rc0sp/anka-mfo-backend.git
cd anka-mfo-backend
npm install
cp .env.example .env

# Configure DB_HOST em .env:
# - Docker: "postgres"
# - Local:  "localhost"

npm run dev
```

## 📋 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento com hot-reload (tsx watch)
npm run build        # Compilar TypeScript → dist/
npm run start        # Rodar versão compilada
npm test             # Rodar testes (Vitest) - requer backend rodando
npm run type-check   # TypeScript strict validation
```

## 🏗️ Arquitetura

**Padrão:** Layered Architecture com Domain-Driven Design

```
src/
├── domain/              # Entidades, tipos, interfaces
│   └── entities.ts      # 7 domínios (Client, Simulation, etc)
├── infra/               # Implementações
│   ├── repositories/    # 6 repositories (CRUD)
│   └── factory.ts       # Dependency Injection
├── http/                # HTTP concerns
│   ├── controllers/     # Lógica de request/response
│   ├── routes/          # Route registration
│   └── middleware/      # Error handling
├── db/                  # Database
│   ├── connect.ts       # Pool de conexões
│   └── schema.ts        # Drizzle ORM schema
├── config/              # Configuração
│   └── env.ts           # Zod validation
├── app.ts               # Fastify factory
├── index.ts             # Entry point + graceful shutdown
└── __tests__/           # Testes de integração
    └── api.integration.test.ts
```

### Princípios Aplicados
- ✅ **SOLID**: Single Responsibility, Open/Closed
- ✅ **DRY**: Sem duplicação de lógica
- ✅ **KISS**: Simplicidade antes de tudo
- ✅ **Type Safety**: TypeScript strict mode
- ✅ **Testability**: Interfaces, DI, repository pattern

## 🗄️ Database

**ORM:** Drizzle ORM (schema-first, type-safe)

**Tabelas:**
- `clients` - Clientes/Investidores
- `simulations` - Simulações de investimento
- `allocations` - Alocações de capital
- `transactions` - Movimentações financeiras
- `insurances` - Coberturas
- `simulation_versions` - Histórico
- `users` - Futura autenticação

**Features:**
- 8 índices para performance
- 4 ENUMs customizados
- Foreign keys com cascade
- Timestamps automáticos (created_at, updated_at)

## 📡 API

**Documentation:** Swagger UI em `/docs`

```
GET    /health                  Status + uptime
GET    /clients                 Lista paginada
POST   /clients                 Criar (Zod validation)
GET    /clients/:id             Detalhe (UUID validation)
PUT    /clients/:id             Atualizar (parcial)
DELETE /clients/:id             Soft delete
GET    /docs/json              OpenAPI schema
GET    /docs                   Swagger UI
```

**Response Format:**
```json
{
  "success": true,
  "data": {...} | [...],
  "count": 0,
  "error": "string" | undefined
}
```

## ✅ Testes de Integração

**Framework:** Vitest 3.2.4 (HTTP integration tests)

### Rodar Testes

```bash
npm test                          # Rodar todos (35 testes)
npm test -- --ui                 # Interface visual (Vitest UI)
npm test -- api.integration       # Arquivo específico
npm test -- allocation            # Testes de alocação
npm test -- transaction           # Testes de transação
```

### Cobertura Completa (35 testes implementados)

**Clientes:**
- ✅ GET /health
- ✅ GET /clients (listar todos)
- ✅ POST /clients (criar com validação)
- ✅ POST /clients (rejeitar CPF inválido)
- ✅ GET /clients/:id (rejeitar UUID inválido)
- ✅ GET /docs/json (Swagger documentation)

**Simulações & Projeção:**
- ✅ GET /simulations/:id/projection (mensal + anual + resumo)

**Alocações (6 testes):**
- ✅ POST /allocations (criar com allocationDate)
- ✅ GET /simulations/:id/allocations (listar com datas)
- ✅ GET /allocations/:id (buscar por ID)
- ✅ PUT /allocations/:id (atualizar)
- ✅ DELETE /allocations/:id (deletar)

**Transações (4 testes):**
- ✅ POST /transactions
- ✅ GET /allocations/:id/transactions
- ✅ GET /transactions/:id
- ✅ DELETE /transactions/:id

**Seguros (5 testes):**
- ✅ POST /insurances
- ✅ GET /simulations/:id/insurances
- ✅ GET /insurances/:id
- ✅ PUT /insurances/:id
- ✅ DELETE /insurances/:id

**Features Avançadas:**
- ✅ GET /clients/:clientId/realized (patrimônio realizado)
- ✅ POST /clients/:clientId/compare (comparar simulações)

**Status:** 23 testes passando (quando DB rodando) + 12 testes skipped (sem DB)

**Requisitos:**
- PostgreSQL acessível em localhost:5432
- .env configurado com DB credentials
- Backend rodando ou Docker Compose up

## 🔧 Stack Técnico

| Layer | Tecnologia | Versão |
|-------|-----------|--------|
| Runtime | Node.js | 24 LTS |
| Framework | Fastify | 5.1.0 |
| Language | TypeScript | 5.3.3 |
| Database | PostgreSQL | 17 Alpine |
| ORM | Drizzle | 0.35.x |
| Validation | Zod | 3.22.4 |
| Testing | Vitest | 3.2.4 |
| Driver | pg | 8.12.0 |

**Plugins Fastify:**
- @fastify/cors 11.0.0
- @fastify/helmet 13.0.0
- @fastify/swagger 9.0.0
- @fastify/swagger-ui 5.0.0

## 🔐 Segurança

**Implementado (Fase 2):**
- ✅ Input validation (Zod)
- ✅ Error handling centralizado
- ✅ Environment variables tipadas
- ✅ Security headers (Helmet)
- ✅ CORS configurado
- ✅ UUID validation

**Próximo (Fase 8):**
- JWT authentication
- RBAC (role-based access)
- Rate limiting
- Audit logging

## 📚 Decisões Importantes

### Por que Fastify?
- **Performance**: 2x mais rápido que Express em benchmarks
- **TypeScript**: Suporte nativo
- **Plugins**: Ecossistema maduro e tipo-seguro
- **Hooks**: Lifecycle management simplificado

### Por que Drizzle ORM?
- **Schema-first**: Tipos derivados do schema
- **Type-safe**: Queries validadas em tempo de compilação
- **Zero runtime overhead**: Sem query builder pesado
- **Migrations**: Automáticas e simples

### Por que Repository Pattern?
- **Abstração**: Trocar DB sem alterar controllers
- **Testabilidade**: Mock fácil de repositórios
- **SOLID**: Dependency inversion

### Por que Zod?
- **Runtime validation**: Valida em execução
- **Type inference**: TypeScript derives types
- **Error messages**: Clara e em português
- **Performance**: Rápido mesmo em validações complexas

## 🎯 Próximas Fases

**Fase 3 (3-4h):** Motor de Projeção Financeira
- SimulationService com lógica de cálculo
- Novos endpoints de Simulation
- Testes unitários

**Fase 4:** API REST Avançada
- Filtros, paginação, sorting
- Endpoints dos recursos restantes

**Fase 8:** Segurança e Auth
- JWT
- RBAC
- Rate limiting

## 🤝 Contributing

```bash
git checkout -b feature/sua-feature
git commit -m "feat: descrição"
git push origin feature/sua-feature
```

**Checklist antes de PR:**
- ✅ `npm test` passando
- ✅ `npm run type-check` sem erros
- ✅ Sem console.log
- ✅ Mensagens em inglês no código, português em erro/docs

## 📞 Suporte

Dúvidas? Ver [docs/02-phases/02-backend-estrutura.md](../docs/02-phases/02-backend-estrutura.md)

---

**Status:** ✅ Fase 2 Concluída | **v1.0.0** | Dezembro 2025


### Health Check
```
GET /health              # Status da API
```

### Documentação
```
GET /docs                # Swagger UI
```

## 🧪 Testing

```bash
# Rodar testes
npm run test

# Com cobertura
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🛠️ Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Executa em development (hot reload) |
| `npm run build` | Compila TypeScript |
| `npm run start` | Executa versão compilada |
| `npm run type-check` | Verifica tipos TypeScript |
| `npm run db:generate` | Gera migrations Drizzle |
| `npm run db:push` | Aplica schema ao banco |
| `npm run test` | Executa testes |

## 📚 Padrões & Boas Práticas

- ✅ **Layered Architecture**: Separação clara de responsabilidades
- ✅ **Repository Pattern**: Abstração de data access
- ✅ **Dependency Injection**: Factory para criar dependências
- ✅ **Type Safety**: TypeScript strict mode + Zod validation
- ✅ **Error Handling**: Classes customizadas de erro
- ✅ **SOLID Principles**: Aplicados em todas as camadas

## 🔒 Segurança

- Helmet.js para headers HTTP
- CORS configurado
- Validação com Zod
- Inputs sanitizados

## 📖 Documentação Detalhada

- [Fase 2 Status](./FASE_2_STATUS.md) - Detalhes da Fase 2
- [Rotas](./docs/ROUTES.md) - Documentação de endpoints
- [Domain Model](./docs/DOMAIN_MODEL.md) - Estrutura de entidades

## 🚀 Próximas Fases

- **Fase 3**: Motor de Projeção
- **Fase 4**: Services Avançados & Validações
- **Fase 5**: Autenticação JWT
- **Fase 6**: Autorização & Permissões
- **Fase 7**: Testes Completos
- **Fase 8**: Admin & Monitoramento

## 📝 Licença

MIT

## 👥 Contribuidores

Desenvolvido para Anka Platform

---

**Status**: ✅ Fase 2 - Backend Structure Completa
