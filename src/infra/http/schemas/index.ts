import { z } from 'zod';

// ============ PARAMS ==========
export const idParamSchema = z.object({
    id: z.string().uuid('ID deve ser um UUID válido'),
});

export const clientIdParamSchema = z.object({
    clientId: z.string().uuid('ID do cliente deve ser um UUID válido'),
});

// ============ SIMULATION ==========
export const lifeStatusSchema = z.enum(['normal', 'dead', 'invalid']);

export const simulationResponseSchema = z.object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    status: z.string(),
    initialCapital: z.number(),
    monthlyContribution: z.number(),
    inflationRate: z.number(),
    yearsProjection: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const versionSchema = z.object({
    id: z.string().uuid(),
    simulationId: z.string().uuid(),
    versionNumber: z.number(),
    snapshot: z.any(),
    createdAt: z.string().datetime(),
});

export const projectionQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    interestRate: z.coerce.number().min(0).max(1).optional(),
    inflationRate: z.coerce.number().min(0).max(1).optional(),
    lifeStatus: z.string().optional(),
    lifeStatusChangeDate: z.string().datetime().optional(),
    years: z.coerce.number().int().min(1).max(50).optional(),
});

export const projectionPointSchema = z.object({
    date: z.string().datetime(),
    financialAssets: z.number(),
    propertyAssets: z.number(),
    totalAssets: z.number(),
    totalWithoutInsurance: z.number(),
    entries: z.number(),
    exits: z.number(),
    insurancePremiums: z.number(),
    insurancePayouts: z.number(),
    financingPayments: z.number(),
});

export const yearlyProjectionSchema = z.object({
    year: z.number(),
    financialAssets: z.number(),
    propertyAssets: z.number(),
    totalAssets: z.number(),
});

export const projectionSummarySchema = z.object({
    initialAssets: z.number(),
    finalAssets: z.number(),
    totalGrowth: z.number(),
    totalGrowthPercent: z.number(),
    totalEntries: z.number(),
    totalExits: z.number(),
    insuranceImpact: z.number(),
});

export const projectionResponseSchema = z.object({
    monthly: z.array(projectionPointSchema),
    yearly: z.array(yearlyProjectionSchema),
    summary: projectionSummarySchema,
});

export const compareSimulationsSchema = z.object({
    simulationIds: z.array(z.string().uuid()).min(1).max(5),
});

// ============ REALIZED ==========
export const realizedAllocationsSchema = z.object({
    total: z.number(),
    financial: z.number(),
    property: z.number(),
});

export const realizedTransactionTotalsSchema = z.object({
    aporte: z.number(),
    resgate: z.number(),
    rendimento: z.number(),
    taxa: z.number(),
});

export const realizedTransactionsSchema = z.object({
    totalEntries: z.number(),
    totalExits: z.number(),
    perType: realizedTransactionTotalsSchema,
});

export const realizedInsurancesSchema = z.object({
    count: z.number().int(),
    totalMonthlyCost: z.number(),
    totalCoverage: z.number(),
});

export const realizedResponseSchema = z.object({
    clientId: z.string().uuid(),
    totalAssets: z.number(),
    allocations: realizedAllocationsSchema,
    transactions: realizedTransactionsSchema,
    insurances: realizedInsurancesSchema,
});

// ============ COMPARISON ==========
export const compareSimulationEntrySchema = z.object({
    simulationId: z.string().uuid(),
    name: z.string(),
    projection: projectionResponseSchema,
});

export const comparisonResponseSchema = z.object({
    clientId: z.string().uuid(),
    comparisons: z.array(compareSimulationEntrySchema),
});

// ============ ALLOCATION ==========
export const allocationTypeSchema = z.enum(['financeira', 'imovel']);

export const createAllocationSchema = z.object({
    simulationId: z.string().uuid(),
    type: allocationTypeSchema,
    description: z.string().min(1).max(255),
    percentage: z.number().min(0).max(100),
    initialValue: z.number().min(0),
    annualReturn: z.number().optional(),
    allocationDate: z.string().optional(),
});

export const updateAllocationSchema = createAllocationSchema.partial().omit({ simulationId: true });

export const allocationResponseSchema = z.object({
    id: z.string().uuid(),
    simulationId: z.string().uuid(),
    type: z.string(),
    description: z.string(),
    percentage: z.number(),
    initialValue: z.number(),
    annualReturn: z.number(),
    allocationDate: z.string().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

// ============ TRANSACTION ==========
export const transactionTypeSchema = z.enum(['aporte', 'resgate', 'rendimento', 'taxa']);

export const createTransactionSchema = z.object({
    allocationId: z.string().uuid(),
    type: transactionTypeSchema,
    amount: z.number().min(0),
    description: z.string().optional(),
    transactionDate: z.string().datetime(),
});

export const updateTransactionSchema = createTransactionSchema.partial().omit({ allocationId: true });

export const transactionResponseSchema = z.object({
    id: z.string().uuid(),
    allocationId: z.string().uuid(),
    type: z.string(),
    amount: z.number(),
    description: z.string().nullable(),
    transactionDate: z.string().datetime(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

// ============ INSURANCE ==========
export const createInsuranceSchema = z.object({
    simulationId: z.string().uuid(),
    type: z.string().min(1).max(50),
    description: z.string().optional(),
    coverageAmount: z.number().min(0),
    monthlyCost: z.number().min(0),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
});

export const updateInsuranceSchema = createInsuranceSchema.partial().omit({ simulationId: true });

export const insuranceResponseSchema = z.object({
    id: z.string().uuid(),
    simulationId: z.string().uuid(),
    type: z.string(),
    description: z.string().nullable(),
    coverageAmount: z.number(),
    monthlyCost: z.number(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
