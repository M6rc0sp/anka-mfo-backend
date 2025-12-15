import { ISimulationRepository, ISimulationVersionRepository } from '../../infra/repositories/interfaces';
import { NotFoundError } from '../../domain/entities';

export class SimulationService {
    constructor(
        private readonly simulationRepository: ISimulationRepository,
        private readonly simulationVersionRepository: ISimulationVersionRepository
    ) { }

    async findById(id: string) {
        const simulation = await this.simulationRepository.findById(id);
        if (!simulation) {
            throw new NotFoundError('Simulation', id);
        }
        return simulation;
    }

    async findByClientId(clientId: string) {
        return this.simulationRepository.findByClientId(clientId);
    }

    async createVersion(simulationId: string) {
        const simulation = await this.findById(simulationId);
        return this.simulationVersionRepository.create(simulationId, { snapshot: simulation });
    }

    async listVersions(simulationId: string) {
        await this.findById(simulationId);
        return this.simulationVersionRepository.findBySimulationId(simulationId);
    }
}
