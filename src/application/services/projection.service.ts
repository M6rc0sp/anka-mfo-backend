import { LifeStatus, ProjectionInput, ProjectionOutput, TransactionTimeline } from '../../domain/services/projection-engine';
import { ProjectionEngineImpl } from '../../domain/services/projection-engine-impl';
import {
    IAllocationRepository,
    IClientRepository,
    IInsuranceRepository,
    ISimulationRepository,
    ITransactionRepository,
} from '../../infra/repositories/interfaces';
import { Insurance, NotFoundError } from '../../domain/entities';
import { InsurancePolicy } from '../../domain/services/projection-engine';

interface ProjectionExecutionPayload {
    startDate: Date;
    endDate: Date;
    interestRate: number;
    inflationRate: number;
    lifeStatus?: LifeStatus;
    lifeStatusChangeDate?: Date;
}

export class ProjectionService {
    private readonly engine = new ProjectionEngineImpl();

    constructor(
        private readonly clientRepository: IClientRepository,
        private readonly simulationRepository: ISimulationRepository,
        private readonly allocationRepository: IAllocationRepository,
        private readonly transactionRepository: ITransactionRepository,
        private readonly insuranceRepository: IInsuranceRepository
    ) { }

    async calcular(simulationId: string, payload: ProjectionExecutionPayload): Promise<ProjectionOutput> {
        const simulation = await this.simulationRepository.findById(simulationId);

        if (!simulation) {
            throw new NotFoundError('Simulation', simulationId);
        }

        const client = await this.clientRepository.findById(simulation.clientId);
        const allocations = await this.allocationRepository.findBySimulationId(simulationId);
        const transactions = await this.loadTransactionsForAllocations(allocations);
        const insurances = await this.insuranceRepository.findBySimulationId(simulationId);
        const lifeStatus = this.resolveLifeStatus(payload.lifeStatus, client?.status);

        const engineInput: ProjectionInput = {
            startDate: payload.startDate,
            endDate: payload.endDate,
            interestRate: payload.interestRate ?? 0,
            inflationRate: payload.inflationRate ?? 0,
            lifeStatus,
            lifeStatusChangeDate: payload.lifeStatusChangeDate,
            allocations: this.mapAllocations(allocations),
            transactions,
            insurances: this.mapInsurances(insurances),
        };

        return this.engine.calculate(engineInput);
    }

    private resolveLifeStatus(requested?: LifeStatus, clientStatus?: string): LifeStatus {
        if (requested) {
            return requested;
        }

        switch (clientStatus) {
            case 'falecido':
                return 'dead';
            case 'incapacidade':
                return 'invalid';
            default:
                return 'normal';
        }
    }

    private async loadTransactionsForAllocations(
        allocations: Array<{ id: string }>
    ): Promise<TransactionTimeline[]> {
        const transactions = await Promise.all(
            allocations.map((allocation) => this.transactionRepository.findByAllocationId(allocation.id))
        );

        return transactions
            .flat()
            .map((tx) => this.mapTransaction(tx));
    }

    private mapAllocations(allocations: Array<{ type: string; description?: string; initialValue: number }>) {
        return allocations.map((allocation) => ({
            type: (allocation.type === 'imovel' ? 'property' : 'financial') as 'financial' | 'property',
            name: allocation.description ?? 'Alocação',
            value: Number(allocation.initialValue),
            isFinanced: false,
        }));
    }

    private mapTransaction(transaction: any): TransactionTimeline {
        const type = this.mapTransactionType(transaction.type);

        return {
            type,
            name: transaction.description ?? 'Movimentação',
            value: Number(transaction.amount),
            startDate: new Date(transaction.transactionDate),
            endDate: new Date(transaction.transactionDate),
            interval: 'monthly',
        };
    }

    private mapTransactionType(value: string): TransactionTimeline['type'] {
        if (value === 'resgate') return 'withdrawal';
        if (value === 'taxa') return 'expense';
        if (value === 'aporte') return 'income';
        return 'income';
    }

    private mapInsurances(insurances: Insurance[]): InsurancePolicy[] {
        return insurances.map((insurance) => {
            const type = this.mapInsuranceType(insurance.type);
            return {
                id: insurance.id,
                type,
                name: insurance.description ?? 'Seguro',
                monthlyPremium: Number(insurance.monthlyCost),
                coverageValue: Number(insurance.coverageAmount),
                startDate: new Date(insurance.startDate),
                endDate: insurance.endDate ? new Date(insurance.endDate) : undefined,
            };
        });
    }

    private mapInsuranceType(value: string) {
        const normalized = value.toLowerCase();
        if (normalized.includes('vida')) return 'life';
        if (normalized.includes('inval') || normalized.includes('invalid')) return 'invalidity';
        return 'general';
    }
}
