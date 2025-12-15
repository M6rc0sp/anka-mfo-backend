import { describe, it, expect } from 'vitest';
import { InsurancePolicy, TransactionTimeline } from '../projection-engine';
import { ProjectionEngineImpl } from '../projection-engine-impl';

const engine = new ProjectionEngineImpl();

describe('ProjectionEngineImpl', () => {
    it('calculates growth using compound interest without transactions', () => {
        const input = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2025-01-01'),
            interestRate: 0.1,
            inflationRate: 0.04,
            lifeStatus: 'normal' as const,
            allocations: [
                {
                    type: 'financial' as const,
                    name: 'CDB',
                    value: 100_000,
                },
            ],
            transactions: [] satisfies TransactionTimeline[],
            insurances: [] satisfies InsurancePolicy[],
        };

        const result = engine.calculate(input);

        expect(result.monthly).toHaveLength(13);
        expect(result.summary.finalAssets).toBeGreaterThan(105_000);
    });

    it('accounts for monthly salary and expenses', () => {
        const input = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2025-01-01'),
            interestRate: 0.1,
            inflationRate: 0.04,
            lifeStatus: 'normal' as const,
            allocations: [
                {
                    type: 'financial' as const,
                    name: 'Poupança',
                    value: 50_000,
                },
            ],
            transactions: [
                {
                    type: 'income' as const,
                    name: 'Salário',
                    value: 10_000,
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2025-01-01'),
                    interval: 'monthly' as const,
                },
                {
                    type: 'expense' as const,
                    name: 'Despesas',
                    value: 7_000,
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2025-01-01'),
                    interval: 'monthly' as const,
                },
            ] satisfies TransactionTimeline[],
            insurances: [] satisfies InsurancePolicy[],
        };

        const result = engine.calculate(input);

        expect(result.summary.finalAssets).toBeGreaterThan(50_000 + 36_000);
        expect(result.summary.totalEntries).toBeGreaterThan(120_000);
        expect(result.summary.totalExits).toBeGreaterThan(80_000);
    });

    it('applies insurance premiums and payouts according to life status', () => {
        const input = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-06-01'),
            interestRate: 0.1,
            inflationRate: 0.04,
            lifeStatus: 'normal' as const,
            allocations: [
                {
                    type: 'financial' as const,
                    name: 'Investimentos',
                    value: 120_000,
                },
            ],
            transactions: [],
            insurances: [
                {
                    id: 'insurance-1',
                    type: 'life' as const,
                    name: 'Seguro Vida',
                    monthlyPremium: 500,
                    coverageValue: 1_000_000,
                    startDate: new Date('2024-01-01'),
                },
            ] satisfies InsurancePolicy[],
        };

        const result = engine.calculate(input);
        const totalPremiums = result.monthly.reduce((sum, month) => sum + month.insurancePremiums, 0);
        const totalPayouts = result.monthly.reduce((sum, month) => sum + month.insurancePayouts, 0);

        expect(totalPremiums).toBeCloseTo(3_000, -1);
        expect(totalPayouts).toBe(0);
    });
});
