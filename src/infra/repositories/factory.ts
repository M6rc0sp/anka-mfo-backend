import {
    ClientRepository,
    SimulationRepository,
    AllocationRepository,
    TransactionRepository,
    InsuranceRepository,
    SimulationVersionRepository,
    IRepositories,
} from './index';

export function createRepositories(): IRepositories {
    return {
        client: new ClientRepository(),
        simulation: new SimulationRepository(),
        allocation: new AllocationRepository(),
        transaction: new TransactionRepository(),
        insurance: new InsuranceRepository(),
        simulationVersion: new SimulationVersionRepository(),
    };
}
