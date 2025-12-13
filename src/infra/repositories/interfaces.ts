import {
    Client,
    Simulation,
    Allocation,
    Transaction,
    Insurance,
    SimulationVersion,
    CreateClientInput,
    CreateSimulationInput,
    CreateAllocationInput,
    CreateTransactionInput,
    CreateInsuranceInput,
} from '../../domain/entities';

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

/**
 * ClientRepository - Interface para operações com clientes
 */
export interface IClientRepository {
    create(input: CreateClientInput): Promise<Client>;
    findById(id: string): Promise<Client | null>;
    findByEmail(email: string): Promise<Client | null>;
    findAll(): Promise<Client[]>;
    update(id: string, data: Partial<Client>): Promise<Client>;
    delete(id: string): Promise<boolean>;
}

/**
 * SimulationRepository - Interface para operações com simulações
 */
export interface ISimulationRepository {
    create(input: CreateSimulationInput): Promise<Simulation>;
    findById(id: string): Promise<Simulation | null>;
    findByClientId(clientId: string): Promise<Simulation[]>;
    findAll(): Promise<Simulation[]>;
    update(id: string, data: Partial<Simulation>): Promise<Simulation>;
    delete(id: string): Promise<boolean>;
}

/**
 * AllocationRepository - Interface para operações com alocações
 */
export interface IAllocationRepository {
    create(input: CreateAllocationInput): Promise<Allocation>;
    findById(id: string): Promise<Allocation | null>;
    findBySimulationId(simulationId: string): Promise<Allocation[]>;
    findAll(): Promise<Allocation[]>;
    update(id: string, data: Partial<Allocation>): Promise<Allocation>;
    delete(id: string): Promise<boolean>;
}

/**
 * TransactionRepository - Interface para operações com movimentações
 */
export interface ITransactionRepository {
    create(input: CreateTransactionInput): Promise<Transaction>;
    findById(id: string): Promise<Transaction | null>;
    findByAllocationId(allocationId: string): Promise<Transaction[]>;
    findAll(): Promise<Transaction[]>;
    update(id: string, data: Partial<Transaction>): Promise<Transaction>;
    delete(id: string): Promise<boolean>;
}

/**
 * InsuranceRepository - Interface para operações com seguros
 */
export interface IInsuranceRepository {
    create(input: CreateInsuranceInput): Promise<Insurance>;
    findById(id: string): Promise<Insurance | null>;
    findBySimulationId(simulationId: string): Promise<Insurance[]>;
    findAll(): Promise<Insurance[]>;
    update(id: string, data: Partial<Insurance>): Promise<Insurance>;
    delete(id: string): Promise<boolean>;
}

/**
 * SimulationVersionRepository - Interface para operações com histórico de versões
 */
export interface ISimulationVersionRepository {
    create(simulationId: string, data: Omit<SimulationVersion, 'id' | 'createdAt'>): Promise<SimulationVersion>;
    findById(id: string): Promise<SimulationVersion | null>;
    findBySimulationId(simulationId: string): Promise<SimulationVersion[]>;
    findAll(): Promise<SimulationVersion[]>;
}

// ============================================================================
// REPOSITORY CONTAINER
// ============================================================================

export interface IRepositories {
    client: IClientRepository;
    simulation: ISimulationRepository;
    allocation: IAllocationRepository;
    transaction: ITransactionRepository;
    insurance: IInsuranceRepository;
    simulationVersion: ISimulationVersionRepository;
}
