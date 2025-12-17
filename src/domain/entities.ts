// ============================================================================
// VALUE OBJECTS
// ============================================================================

export interface Money {
    amount: number;
    currency: string;
}

export interface DateRange {
    startDate: Date;
    endDate?: Date;
}

// ============================================================================
// ENUMS DO DOMÍNIO
// ============================================================================

export enum StatusDeVida {
    VIVO = 'vivo',
    FALECIDO = 'falecido',
    INCAPACIDADE = 'incapacidade',
}

export enum TipoAlocacao {
    FINANCEIRA = 'financeira',
    IMOVEL = 'imovel',
}

export enum TipoMovimentacao {
    APORTE = 'aporte',
    RESGATE = 'resgate',
    RENDIMENTO = 'rendimento',
    TAXA = 'taxa',
}

export enum StatusSimulacao {
    RASCUNHO = 'rascunho',
    ATIVA = 'ativa',
    ARQUIVADA = 'arquivada',
}

export enum Role {
    ADMIN = 'admin',
    ASSESSOR = 'assessor',
}

// ============================================================================
// ENTIDADES DO DOMÍNIO
// ============================================================================

/**
 * Client - Representa um cliente do family office
 */
export interface Client {
    id: string;
    name: string;
    email: string;
    cpf?: string;
    phone?: string;
    birthdate?: Date;
    status: StatusDeVida;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Simulation - Representa uma simulação financeira
 */
export interface Simulation {
    id: string;
    clientId: string;
    name: string;
    description?: string;
    status: StatusSimulacao;
    initialCapital: number;
    monthlyContribution: number;
    inflationRate: number;
    yearsProjection: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Allocation - Representa uma alocação de ativo
 */
export interface Allocation {
    id: string;
    simulationId: string;
    type: TipoAlocacao;
    description: string;
    percentage: number;
    initialValue: number;
    annualReturn: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Transaction - Representa uma movimentação financeira
 */
export interface Transaction {
    id: string;
    allocationId: string;
    type: TipoMovimentacao;
    amount: number;
    description?: string;
    transactionDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Insurance - Representa um seguro ou cobertura
 */
export interface Insurance {
    id: string;
    simulationId: string;
    type: string;
    description?: string;
    coverageAmount: number;
    monthlyCost: number;
    startDate: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * SimulationVersion - Representa uma versão de simulação
 */
export interface SimulationVersion {
    id: string;
    simulationId: string;
    versionNumber: number;
    snapshot: unknown;
    createdAt: Date;
}

/**
 * User - Representa um usuário do sistema (Fase 8)
 */
export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: Role;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// TIPOS DE REQUISIÇÃO/RESPOSTA
// ============================================================================

export interface CreateClientInput {
    name: string;
    email: string;
    cpf?: string;
    phone?: string;
    birthdate?: Date;
}

export interface CreateSimulationInput {
    clientId: string;
    name: string;
    description?: string;
    initialCapital: number;
    monthlyContribution?: number;
    inflationRate?: number;
    yearsProjection?: number;
}

export interface CreateAllocationInput {
    simulationId: string;
    type: TipoAlocacao;
    description: string;
    percentage: number;
    initialValue: number;
    annualReturn?: number;
}

export interface CreateTransactionInput {
    allocationId: string;
    type: TipoMovimentacao;
    amount: number;
    description?: string;
    transactionDate: Date;
}

export interface CreateInsuranceInput {
    simulationId: string;
    type: string;
    description?: string;
    coverageAmount: number;
    monthlyCost: number;
    startDate: Date;
    endDate?: Date;
}

// ============================================================================
// TIPOS DE ERRO
// ============================================================================

export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainError';
    }
}

export class NotFoundError extends DomainError {
    constructor(resource: string, id: string) {
        super(`${resource} with id ${id} not found`);
        this.name = 'NotFoundError';
    }
}

export class InvalidInputError extends DomainError {
    constructor(message: string) {
        super(`Invalid input: ${message}`);
        this.name = 'InvalidInputError';
    }
}

export class ConflictError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = 'ConflictError';
    }
}
