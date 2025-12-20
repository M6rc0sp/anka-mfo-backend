import {
    AllocationSnapshot,
    InsurancePolicy,
    LifeStatus,
    ProjectionEngine,
    ProjectionInput,
    ProjectionOutput,
    MonthlyProjection,
    YearlyProjection,
    ProjectionSummary,
    TransactionTimeline,
} from './projection-engine';

interface FinancingState {
    monthlyPayment: number;
    remainingPayments: number;
}

export class ProjectionEngineImpl implements ProjectionEngine {
    calculate(input: ProjectionInput): ProjectionOutput {
        const monthly = this.calculateMonthly(input);
        const yearly = this.aggregateYearly(monthly);
        const summary = this.generateSummary(monthly);

        return { monthly, yearly, summary };
    }

    private calculateMonthly(input: ProjectionInput): MonthlyProjection[] {
        const projections: MonthlyProjection[] = [];
        let financialAssets = this.sumAllocations(input.allocations, 'financial');
        let propertyAssets = this.sumAllocations(input.allocations, 'property');
        let financialWithoutInsurance = financialAssets;
        const monthlyRate = this.getMonthlyRate(input.interestRate, input.inflationRate);
        const financingStates = this.initializeFinancingState(input.allocations);

        let currentDate = this.startOfMonth(new Date(input.startDate));
        const endDate = this.startOfMonth(new Date(input.endDate));
        const insurancePaidPolicies = new Set<string>();

        while (currentDate <= endDate) {
            const lifeStatus = this.getLifeStatus(currentDate, input);
            const entries = this.calculateEntries(currentDate, input.transactions, lifeStatus);
            const exits = this.calculateExits(currentDate, input.transactions, lifeStatus);
            const { insurancePremiums, insurancePayouts } = this.calculateInsurance(
                currentDate,
                input.insurances,
                lifeStatus,
                insurancePaidPolicies
            );
            const financingPayments = this.calculateFinancingPayments(financingStates);

            financialAssets =
                financialAssets * (1 + monthlyRate) +
                entries -
                exits -
                insurancePremiums +
                insurancePayouts -
                financingPayments;

            financialWithoutInsurance =
                financialWithoutInsurance * (1 + monthlyRate) +
                entries -
                exits -
                financingPayments;

            propertyAssets = this.updatePropertyAssets(propertyAssets, input.inflationRate);

            const totalAssets = Math.max(0, financialAssets) + propertyAssets;
            const totalWithoutInsurance = Math.max(0, financialWithoutInsurance) + propertyAssets;

            projections.push({
                date: new Date(currentDate),
                financialAssets: Math.max(0, financialAssets),
                propertyAssets,
                totalAssets,
                totalWithoutInsurance,
                entries,
                exits,
                insurancePremiums,
                insurancePayouts,
                financingPayments,
            });

            currentDate = this.addMonths(currentDate, 1);
        }

        return projections;
    }

    private getMonthlyRate(annual: number, inflation: number): number {
        // Converte de porcentagem para decimal se necessário (ex: 8.5 -> 0.085)
        const annualDecimal = annual > 1 ? annual / 100 : annual;
        const inflationDecimal = inflation > 1 ? inflation / 100 : inflation;
        const realRate = (1 + annualDecimal) / (1 + inflationDecimal) - 1;
        return Math.pow(1 + realRate, 1 / 12) - 1;
    }

    private startOfMonth(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    private addMonths(date: Date, months: number): Date {
        const next = new Date(date);
        next.setMonth(next.getMonth() + months);
        return next;
    }

    private sumAllocations(allocations: AllocationSnapshot[], type: 'financial' | 'property'): number {
        return allocations
            .filter((allocation) => allocation.type === type)
            .reduce((total, allocation) => total + allocation.value, 0);
    }

    private getLifeStatus(current: Date, input: ProjectionInput): LifeStatus {
        if (!input.lifeStatusChangeDate) {
            return input.lifeStatus;
        }

        return current >= this.startOfMonth(input.lifeStatusChangeDate)
            ? input.lifeStatus
            : 'normal';
    }

    private calculateEntries(date: Date, transactions: TransactionTimeline[], status: LifeStatus): number {
        const multiplier = status === 'normal' ? 1 : 0;
        return transactions
            .filter((tx) => this.isTransactionActive(date, tx))
            .filter((tx) => tx.type === 'income' || tx.type === 'deposit')
            .reduce((total, tx) => total + tx.value * multiplier, 0);
    }

    private calculateExits(date: Date, transactions: TransactionTimeline[], status: LifeStatus): number {
        const multiplier = status === 'dead' ? 0.5 : 1;
        return transactions
            .filter((tx) => this.isTransactionActive(date, tx))
            .filter((tx) => tx.type === 'expense' || tx.type === 'withdrawal')
            .reduce((total, tx) => total + tx.value * multiplier, 0);
    }

    private calculateInsurance(
        date: Date,
        insurances: InsurancePolicy[],
        status: LifeStatus,
        paidPolicies: Set<string>
    ): { insurancePremiums: number; insurancePayouts: number } {
        let insurancePremiums = 0;
        let insurancePayouts = 0;

        insurances.forEach((policy) => {
            if (!this.isPolicyActive(date, policy)) {
                return;
            }

            if (status === 'normal') {
                insurancePremiums += policy.monthlyPremium;
                return;
            }

            if (status === 'dead' && policy.type === 'life' && !paidPolicies.has(policy.id)) {
                insurancePayouts += policy.coverageValue;
                paidPolicies.add(policy.id);
                return;
            }

            if (status === 'invalid' && policy.type === 'invalidity' && !paidPolicies.has(policy.id)) {
                insurancePayouts += policy.coverageValue;
                paidPolicies.add(policy.id);
            }
        });

        return { insurancePremiums, insurancePayouts };
    }

    private calculateFinancingPayments(financingStates: FinancingState[]): number {
        let totalPayments = 0;

        financingStates.forEach((state) => {
            if (state.monthlyPayment <= 0 || state.remainingPayments <= 0) {
                return;
            }

            totalPayments += state.monthlyPayment;
            state.remainingPayments -= 1;
        });

        return totalPayments;
    }

    private initializeFinancingState(allocations: AllocationSnapshot[]): FinancingState[] {
        return allocations.map((allocation) => ({
            monthlyPayment: allocation.monthlyPayment ?? 0,
            remainingPayments: allocation.remainingPayments ?? 0,
        }));
    }

    private updatePropertyAssets(current: number, inflationRate: number): number {
        // Converte de porcentagem para decimal se necessário (ex: 3.5 -> 0.035)
        const inflationDecimal = inflationRate > 1 ? inflationRate / 100 : inflationRate;
        const monthlyInflation = Math.pow(1 + inflationDecimal, 1 / 12) - 1;
        return current * (1 + monthlyInflation);
    }

    private aggregateYearly(monthly: MonthlyProjection[]): YearlyProjection[] {
        const grouped: Record<number, YearlyProjection> = {};

        monthly.forEach((entry) => {
            const year = entry.date.getFullYear();
            grouped[year] = {
                year,
                financialAssets: entry.financialAssets,
                propertyAssets: entry.propertyAssets,
                totalAssets: entry.totalAssets,
            };
        });

        return Object.values(grouped);
    }

    private generateSummary(monthly: MonthlyProjection[]): ProjectionSummary {
        const first = monthly[0];
        const last = monthly[monthly.length - 1];
        const initialAssets = first ? first.totalAssets : 0;
        const finalAssets = last ? last.totalAssets : 0;
        const totalGrowth = finalAssets - initialAssets;
        const totalGrowthPercent = initialAssets > 0 ? (totalGrowth / initialAssets) * 100 : 0;
        const totalEntries = monthly.reduce((sum, entry) => sum + entry.entries, 0);
        const totalExits = monthly.reduce((sum, entry) => sum + entry.exits, 0);
        const insuranceImpact = last ? last.totalWithoutInsurance - last.totalAssets : 0;

        return {
            initialAssets,
            finalAssets,
            totalGrowth,
            totalGrowthPercent,
            totalEntries,
            totalExits,
            insuranceImpact,
        };
    }

    private isTransactionActive(date: Date, tx: TransactionTimeline): boolean {
        const current = this.startOfMonth(date);
        const start = this.startOfMonth(tx.startDate);
        const end = tx.endDate ? this.startOfMonth(tx.endDate) : start;

        if (current < start || current > end) {
            return false;
        }

        if (tx.interval === 'monthly') {
            return true;
        }

        return current.getMonth() === start.getMonth();
    }

    private isPolicyActive(date: Date, policy: InsurancePolicy): boolean {
        const current = this.startOfMonth(date);
        const start = this.startOfMonth(policy.startDate);
        const end = policy.endDate
            ? this.startOfMonth(policy.endDate)
            : new Date(8640000000000000);

        if (current < start) {
            return false;
        }

        if (policy.endDate && current > end) {
            return false;
        }

        return true;
    }
}
