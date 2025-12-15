export type LifeStatus = 'normal' | 'dead' | 'invalid';

export interface AllocationSnapshot {
    type: 'financial' | 'property';
    name: string;
    value: number;
    isFinanced?: boolean;
    monthlyPayment?: number;
    remainingPayments?: number;
}

export type TransactionType = 'income' | 'expense' | 'deposit' | 'withdrawal';
export type TransactionInterval = 'monthly' | 'yearly';

export interface TransactionTimeline {
    type: TransactionType;
    name: string;
    value: number;
    startDate: Date;
    endDate?: Date;
    interval: TransactionInterval;
}

export type InsuranceType = 'life' | 'invalidity' | 'general';

export interface InsurancePolicy {
    id: string;
    type: InsuranceType;
    name: string;
    monthlyPremium: number;
    coverageValue: number;
    startDate: Date;
    endDate?: Date;
}

export interface ProjectionInput {
    startDate: Date;
    endDate: Date;
    interestRate: number; // anual
    inflationRate: number; // anual
    lifeStatus: LifeStatus;
    lifeStatusChangeDate?: Date;
    allocations: AllocationSnapshot[];
    transactions: TransactionTimeline[];
    insurances: InsurancePolicy[];
}

export interface MonthlyProjection {
    date: Date;
    financialAssets: number;
    propertyAssets: number;
    totalAssets: number;
    totalWithoutInsurance: number;
    entries: number;
    exits: number;
    insurancePremiums: number;
    insurancePayouts: number;
    financingPayments: number;
}

export interface YearlyProjection {
    year: number;
    financialAssets: number;
    propertyAssets: number;
    totalAssets: number;
}

export interface ProjectionSummary {
    initialAssets: number;
    finalAssets: number;
    totalGrowth: number;
    totalGrowthPercent: number;
    totalEntries: number;
    totalExits: number;
    insuranceImpact: number;
}

export interface ProjectionOutput {
    monthly: MonthlyProjection[];
    yearly: YearlyProjection[];
    summary: ProjectionSummary;
}

export interface ProjectionEngine {
    calculate(input: ProjectionInput): ProjectionOutput;
}
