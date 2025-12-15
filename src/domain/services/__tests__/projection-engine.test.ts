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

    it('paga seguro apenas uma vez ao ficar falecido', () => {
        const input = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-04-01'),
            interestRate: 0.1,
            inflationRate: 0.04,
            lifeStatus: 'dead' as const,
            allocations: [
                {
                    type: 'financial' as const,
                    name: 'Tesouro Direto',
                    value: 80_000,
                },
            ],
            transactions: [] satisfies TransactionTimeline[],
            insurances: [
                {
                    id: 'life-1',
                    type: 'life' as const,
                    name: 'Seguro Vida',
                    monthlyPremium: 0,
                    coverageValue: 250_000,
                    startDate: new Date('2024-01-01'),
                },
            ] satisfies InsurancePolicy[],
        };

        const result = engine.calculate(input);
        const totalPayouts = result.monthly.reduce((sum, month) => sum + month.insurancePayouts, 0);

        expect(totalPayouts).toBe(250_000);
        expect(result.monthly.every((month) => month.insurancePremiums === 0)).toBe(true);
    });

    it('interrompe entradas ao tornar-se inválido após mudança de status', () => {
        const startDate = new Date('2024-01-01');
        const changeDate = new Date('2024-04-01');

        const input = {
            startDate,
            endDate: new Date('2024-06-01'),
            interestRate: 0.1,
            inflationRate: 0.04,
            lifeStatus: 'invalid' as const,
            lifeStatusChangeDate: changeDate,
            allocations: [
                {
                    type: 'financial' as const,
                    name: 'Reserva',
                    value: 60_000,
                },
            ],
            transactions: [
                {
                    type: 'income' as const,
                    name: 'Salário',
                    value: 8_000,
                    startDate,
                    endDate: new Date('2024-06-01'),
                    interval: 'monthly' as const,
                },
            ] satisfies TransactionTimeline[],
            insurances: [] satisfies InsurancePolicy[],
        };

        const result = engine.calculate(input);
        const january = result.monthly[0];
        const april = result.monthly.find((month) => month.date.getMonth() === 3);

        expect(january.entries).toBeGreaterThan(0);
        expect(april).toBeDefined();
        expect(april!.entries).toBe(0);
    });

    it('registra pagamentos de financiamento e cessa após poucas parcelas', () => {
        const input = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-04-01'),
            interestRate: 0.1,
            inflationRate: 0.04,
            lifeStatus: 'normal' as const,
            allocations: [
                {
                    type: 'financial' as const,
                    name: 'Imóvel Financiado',
                    value: 200_000,
                    monthlyPayment: 2_000,
                    remainingPayments: 3,
                },
            ],
            transactions: [] satisfies TransactionTimeline[],
            insurances: [] satisfies InsurancePolicy[],
        };

        const result = engine.calculate(input);
        const totalFinancing = result.monthly.reduce((sum, month) => sum + month.financingPayments, 0);

        expect(totalFinancing).toBe(6_000);
        const financingMonths = result.monthly.filter((month) => month.financingPayments > 0);
        expect(financingMonths).toHaveLength(3);
    });
});
