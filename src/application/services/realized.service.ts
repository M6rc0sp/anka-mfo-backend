import {
    IAllocationRepository,
    IInsuranceRepository,
    ISimulationRepository,
    ITransactionRepository,
} from '../../infra/repositories/interfaces';

export interface RealizedOutput {
    clientId: string;
    totalAssets: number;
    allocations: {
        total: number;
        financial: number;
        property: number;
    };
    transactions: {
        totalEntries: number;
        totalExits: number;
        perType: {
            aporte: number;
            resgate: number;
            rendimento: number;
            taxa: number;
        };
    };
    insurances: {
        count: number;
        totalMonthlyCost: number;
        totalCoverage: number;
    };
}

export class RealizedService {
    constructor(
        private readonly simulationRepository: ISimulationRepository,
        private readonly allocationRepository: IAllocationRepository,
        private readonly transactionRepository: ITransactionRepository,
        private readonly insuranceRepository: IInsuranceRepository
    ) { }

    async calcular(clientId: string): Promise<RealizedOutput> {
        const simulations = await this.simulationRepository.findByClientId(clientId);

        let totalFinancial = 0;
        let totalProperty = 0;
        let totalAporte = 0;
        let totalResgate = 0;
        let totalRendimento = 0;
        let totalTaxa = 0;
        let insuranceCount = 0;
        let totalMonthlyCost = 0;
        let totalCoverage = 0;

        for (const simulation of simulations) {
            const allocations = await this.allocationRepository.findBySimulationId(simulation.id);

            for (const allocation of allocations) {
                const value = Number(allocation.initialValue);
                if (allocation.type === 'financeira') {
                    totalFinancial += value;
                } else {
                    totalProperty += value;
                }

                const transactions = await this.transactionRepository.findByAllocationId(allocation.id);
                for (const tx of transactions) {
                    const amount = Number(tx.amount);
                    switch (tx.type) {
                        case 'aporte':
                            totalAporte += amount;
                            break;
                        case 'resgate':
                            totalResgate += amount;
                            break;
                        case 'rendimento':
                            totalRendimento += amount;
                            break;
                        case 'taxa':
                            totalTaxa += amount;
                            break;
                    }
                }
            }

            const insurances = await this.insuranceRepository.findBySimulationId(simulation.id);
            insuranceCount += insurances.length;
            for (const insurance of insurances) {
                totalMonthlyCost += Number(insurance.monthlyCost);
                totalCoverage += Number(insurance.coverageAmount);
            }
        }

        const totalAllocations = totalFinancial + totalProperty;
        const totalEntries = totalAporte + totalRendimento;
        const totalExits = totalResgate + totalTaxa;

        return {
            clientId,
            totalAssets: totalAllocations + totalEntries - totalExits,
            allocations: {
                total: totalAllocations,
                financial: totalFinancial,
                property: totalProperty,
            },
            transactions: {
                totalEntries,
                totalExits,
                perType: {
                    aporte: totalAporte,
                    resgate: totalResgate,
                    rendimento: totalRendimento,
                    taxa: totalTaxa,
                },
            },
            insurances: {
                count: insuranceCount,
                totalMonthlyCost,
                totalCoverage,
            },
        };
    }
}
