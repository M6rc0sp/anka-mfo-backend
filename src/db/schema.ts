import {
    pgTable,
    pgEnum,
    uuid,
    varchar,
    decimal,
    integer,
    date,
    timestamp,
    boolean,
    jsonb,
    text,
    index,
} from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS
// ============================================================================

export const statusDeVidaEnum = pgEnum('status_de_vida', ['vivo', 'falecido', 'incapacidade']);
export const tipoAlocacaoEnum = pgEnum('tipo_alocacao', ['financeira', 'imovel']);
export const tipoMovimentacaoEnum = pgEnum('tipo_movimentacao', ['aporte', 'resgate', 'rendimento', 'taxa']);
export const statusSimulacaoEnum = pgEnum('status_simulacao', ['rascunho', 'ativa', 'arquivada']);

// ============================================================================
// TABLES
// ============================================================================

// Clients (Clientes do family office)
export const clients = pgTable(
    'clients',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        name: varchar('name', { length: 255 }).notNull(),
        email: varchar('email', { length: 255 }).notNull().unique(),
        cpf: varchar('cpf', { length: 14 }).unique(),
        phone: varchar('phone', { length: 20 }),
        birthdate: date('birthdate'),
        status: statusDeVidaEnum('status').default('vivo'),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => ({
        idxEmail: index('idx_clients_email').on(table.email),
        idxCpf: index('idx_clients_cpf').on(table.cpf),
    })
);

// Simulations (Simulações financeiras)
export const simulations = pgTable(
    'simulations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        clientId: uuid('client_id')
            .notNull()
            .references(() => clients.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 255 }).notNull(),
        description: text('description'),
        status: statusSimulacaoEnum('status').default('rascunho'),
        initialCapital: decimal('initial_capital', { precision: 15, scale: 2 }).notNull(),
        monthlyContribution: decimal('monthly_contribution', { precision: 15, scale: 2 }).default('0'),
        inflationRate: decimal('inflation_rate', { precision: 5, scale: 2 }).default('3.5'),
        yearsProjection: integer('years_projection').default(20),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => ({
        idxClientId: index('idx_simulations_client_id').on(table.clientId),
        idxStatus: index('idx_simulations_status').on(table.status),
    })
);

// Allocations (Alocações de ativos)
export const allocations = pgTable(
    'allocations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        simulationId: uuid('simulation_id')
            .notNull()
            .references(() => simulations.id, { onDelete: 'cascade' }),
        type: tipoAlocacaoEnum('type').notNull(),
        description: varchar('description', { length: 255 }).notNull(),
        percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
        initialValue: decimal('initial_value', { precision: 15, scale: 2 }).notNull(),
        annualReturn: decimal('annual_return', { precision: 5, scale: 2 }).default('0'),
        allocationDate: date('allocation_date').defaultNow(),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => ({
        idxSimulationId: index('idx_allocations_simulation_id').on(table.simulationId),
    })
);

// Transactions (Movimentações financeiras)
export const transactions = pgTable(
    'transactions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        allocationId: uuid('allocation_id')
            .notNull()
            .references(() => allocations.id, { onDelete: 'cascade' }),
        type: tipoMovimentacaoEnum('type').notNull(),
        amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
        description: text('description'),
        transactionDate: date('transaction_date').notNull(),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => ({
        idxAllocationId: index('idx_transactions_allocation_id').on(table.allocationId),
    })
);

// Insurances (Seguros e coberturas)
export const insurances = pgTable(
    'insurances',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        simulationId: uuid('simulation_id')
            .notNull()
            .references(() => simulations.id, { onDelete: 'cascade' }),
        type: varchar('type', { length: 50 }).notNull(),
        description: text('description'),
        coverageAmount: decimal('coverage_amount', { precision: 15, scale: 2 }).notNull(),
        monthlyCost: decimal('monthly_cost', { precision: 10, scale: 2 }).notNull(),
        startDate: date('start_date').notNull(),
        endDate: date('end_date'),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => ({
        idxSimulationId: index('idx_insurances_simulation_id').on(table.simulationId),
    })
);

// Simulation Versions (Histórico de versões)
export const simulationVersions = pgTable(
    'simulation_versions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        simulationId: uuid('simulation_id')
            .notNull()
            .references(() => simulations.id, { onDelete: 'cascade' }),
        versionNumber: integer('version_number').notNull(),
        snapshot: jsonb('snapshot').notNull(),
        createdAt: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        idxSimulationId: index('idx_simulation_versions_simulation_id').on(table.simulationId),
    })
);

// Users (Autenticação - Fase 8)
export const users = pgTable(
    'users',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        email: varchar('email', { length: 255 }).notNull().unique(),
        passwordHash: varchar('password_hash', { length: 255 }).notNull(),
        role: varchar('role', { length: 50 }).default('assessor'),
        active: boolean('active').default(true),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => ({
        idxEmail: index('idx_users_email').on(table.email),
    })
);

// ============================================================================
// EXPORT ALL TABLES
// ============================================================================

export const schema = {
    clients,
    simulations,
    allocations,
    transactions,
    insurances,
    simulationVersions,
    users,
};
