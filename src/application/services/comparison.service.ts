import { ProjectionService } from './projection.service';
import { ISimulationRepository } from '../../infra/repositories/interfaces';
import { ProjectionOutput } from '../../domain/services/projection-engine';

export interface ComparisonEntry {
    simulationId: string;
    name: string;
    projection: ProjectionOutput;
}

export interface ComparisonOutput {
    clientId: string;
    comparisons: ComparisonEntry[];
}

export class ComparisonService {
    constructor(
        private readonly simulationRepository: ISimulationRepository,
        private readonly projectionService: ProjectionService
    ) { }

    async compare(clientId: string, simulationIds: string[]): Promise<ComparisonOutput> {
        const comparisons: ComparisonEntry[] = [];

        for (const simulationId of simulationIds) {
            const simulation = await this.simulationRepository.findById(simulationId);

            if (!simulation || simulation.clientId !== clientId) {
                continue;
            }

            const now = new Date();
            const endDate = new Date(now);
            endDate.setFullYear(endDate.getFullYear() + (simulation.yearsProjection ?? 20));

            const projection = await this.projectionService.calcular(simulationId, {
                startDate: now,
                endDate,
                interestRate: 0.1,
                inflationRate: Number(simulation.inflationRate ?? 0.035),
            });

            comparisons.push({
                simulationId,
                name: simulation.name,
                projection,
            });
        }

        return {
            clientId,
            comparisons,
        };
    }
}
