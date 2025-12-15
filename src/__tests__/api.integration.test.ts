import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createApp } from '../app';
import { eq } from 'drizzle-orm';
import { clients, simulations, allocations, transactions, insurances } from '../db/schema';
import { db } from '../db/connect';

type AnyRecord = Record<string, unknown>;

describe('Clients API (Integration Tests)', () => {
    let app: FastifyInstance;
    let API_URL: string;

    beforeAll(async () => {
        app = await createApp();
        await app.listen({ port: 0 }); // Use port 0 to get a random available port
        const address = app.server.address();
        if (typeof address === 'string') {
            API_URL = address;
        } else {
            API_URL = `http://localhost:${address?.port}`;
        }
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/health`);
            expect(response.status).toBe(200);

            const body = (await response.json()) as AnyRecord;
            expect(body.status).toBe('ok');
            expect(body.timestamp).toBeDefined();
            expect(body.uptime).toBeGreaterThan(0);
        });
    });

    describe('GET /clients', () => {
        it('should list all clients', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/clients`);
            expect(response.status).toBe(200);

            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.count).toBeGreaterThanOrEqual(0);
        });
    });

    describe('POST /clients', () => {
        it('should create a new client with valid data', async () => {
            const rand = () => Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const clientData = {
                name: 'Test User',
                email: `test-${Date.now()}@example.com`,
                cpf: `${rand()}.${rand()}.${rand()}-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
                phone: '11999999999',
                birthDate: '2000-01-15T00:00:00Z',
            };

            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData),
            });

            expect(response.status).toBe(201);
            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            expect(body.data).not.toStrictEqual({});
        });

        it('should reject invalid CPF format', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test User',
                    email: `invalid-${Date.now()}@example.com`,
                    cpf: '12345678901',
                    phone: '11999999999',
                    birthDate: '2000-01-15T00:00:00Z',
                }),
            });

            expect(response.status).toBe(400);
            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(false);
        });
    });

    describe('GET /clients/:id', () => {
        it('should reject invalid UUID format', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/clients/invalid-id`);
            expect(response.status).toBe(400);
            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(false);
        });
    });

    describe('Swagger Documentation', () => {
        it('should serve OpenAPI JSON schema', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/docs/json`);
            expect(response.status).toBe(200);

            const body = (await response.json()) as Record<string, unknown>;
            expect((body.info as AnyRecord)?.title).toBe('Anka MFO API');
            expect(body.paths).toBeDefined();
            expect(Object.keys(body.paths as AnyRecord).includes('/clients')).toBe(true);
        });
    });

    describe('GET /simulations/:id/projection', () => {
        let clientId: string;
        let simulationId: string;

        beforeAll(async () => {
            const insertedClient = await db
                .insert(clients)
                .values({
                    name: 'Projection Test Client',
                    email: `projection.test+${Date.now()}@example.com`,
                })
                .returning();

            clientId = insertedClient[0].id;

            const insertedSimulation = await db
                .insert(simulations)
                .values({
                    clientId,
                    name: 'Projeção Integration',
                    initialCapital: 100000,
                    monthlyContribution: 1000,
                    inflationRate: 0.03,
                    yearsProjection: 1,
                } as any)
                .returning();

            simulationId = insertedSimulation[0].id;
        });

        afterAll(async () => {
            await db.delete(simulations).where(eq(simulations.id, simulationId));
            await db.delete(clients).where(eq(clients.id, clientId));
        });

        it('retorna projeção e resumo válido', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/simulations/${simulationId}/projection`);

            expect(response.status).toBe(200);
            const body = (await response.json()) as AnyRecord;
            expect(Array.isArray(body.monthly)).toBe(true);
            expect(Array.isArray(body.yearly)).toBe(true);
            expect(body.summary).toBeDefined();
            expect(body.summary).toHaveProperty('initialAssets');
            expect(body.summary).toHaveProperty('finalAssets');
        });
    });

    // ============ TESTES DE ALOCAÇÕES ============
    describe('CRUD /allocations', () => {
        let clientId: string;
        let simulationId: string;
        let allocationId: string;

        beforeAll(async () => {
            const insertedClient = await db
                .insert(clients)
                .values({
                    name: 'Allocation Test Client',
                    email: `allocation.test+${Date.now()}@example.com`,
                })
                .returning();
            clientId = insertedClient[0].id;

            const insertedSimulation = await db
                .insert(simulations)
                .values({
                    clientId,
                    name: 'Allocation Test Sim',
                    initialCapital: 50000,
                } as any)
                .returning();
            simulationId = insertedSimulation[0].id;

            // Criar alocação no beforeAll para testes subsequentes
            const insertedAllocation = await db
                .insert(allocations)
                .values({
                    simulationId,
                    type: 'financeira',
                    description: 'Fundo de Investimento Test',
                    percentage: 50,
                    initialValue: 25000,
                    annualReturn: 0.12,
                } as any)
                .returning();
            allocationId = insertedAllocation[0].id;
        });

        afterAll(async () => {
            await db.delete(allocations).where(eq(allocations.simulationId, simulationId));
            await db.delete(simulations).where(eq(simulations.id, simulationId));
            await db.delete(clients).where(eq(clients.id, clientId));
        });

        it('deve criar uma nova alocação', async () => {
            const allocationData = {
                simulationId,
                type: 'financeira',
                description: 'Nova Alocação via API',
                percentage: 30,
                initialValue: 15000,
                annualReturn: 0.10,
            };

            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/allocations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allocationData),
            });

            expect(response.status).toBe(201);
            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
        });

        it('deve listar alocações de uma simulação', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/simulations/${simulationId}/allocations`);
            expect(response.status).toBe(200);

            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
            expect(Array.isArray(body.data)).toBe(true);
            expect((body.data as AnyRecord[]).length).toBeGreaterThan(0);
        });

        it('deve buscar uma alocação por ID', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/allocations/${allocationId}`);
            expect(response.status).toBe(200);

            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
            expect((body.data as AnyRecord).id).toBe(allocationId);
        });

        it('deve atualizar uma alocação', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/allocations/${allocationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ percentage: 60 }),
            });

            expect(response.status).toBe(200);
            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
        });

        it('deve deletar uma alocação', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/allocations/${allocationId}`, {
                method: 'DELETE',
            });

            expect(response.status).toBe(204);
        });
    });

    // ============ TESTES DE TRANSAÇÕES ============
    describe('CRUD /transactions', () => {
        let clientId: string;
        let simulationId: string;
        let allocationId: string;
        let transactionId: string;

        beforeAll(async () => {
            const insertedClient = await db
                .insert(clients)
                .values({
                    name: 'Transaction Test Client',
                    email: `transaction.test+${Date.now()}@example.com`,
                })
                .returning();
            clientId = insertedClient[0].id;

            const insertedSimulation = await db
                .insert(simulations)
                .values({
                    clientId,
                    name: 'Transaction Test Sim',
                    initialCapital: 50000,
                } as any)
                .returning();
            simulationId = insertedSimulation[0].id;

            const insertedAllocation = await db
                .insert(allocations)
                .values({
                    simulationId,
                    type: 'financeira',
                    description: 'Alocação para transações',
                    percentage: 100,
                    initialValue: 50000,
                    annualReturn: 0.1,
                } as any)
                .returning();
            allocationId = insertedAllocation[0].id;

            // Criar transação no beforeAll para testes subsequentes
            const insertedTransaction = await db
                .insert(transactions)
                .values({
                    allocationId,
                    type: 'aporte',
                    amount: 5000,
                    description: 'Aporte teste',
                    transactionDate: new Date(),
                } as any)
                .returning();
            transactionId = insertedTransaction[0].id;
        });

        afterAll(async () => {
            await db.delete(transactions).where(eq(transactions.allocationId, allocationId));
            await db.delete(allocations).where(eq(allocations.id, allocationId));
            await db.delete(simulations).where(eq(simulations.id, simulationId));
            await db.delete(clients).where(eq(clients.id, clientId));
        });

        it('deve criar uma nova transação', async () => {
            const transactionData = {
                allocationId,
                type: 'aporte',
                amount: 5000,
                description: 'Aporte mensal',
                transactionDate: new Date().toISOString(),
            };

            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });

            expect(response.status).toBe(201);
            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
        });

        it('deve listar transações de uma alocação', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/allocations/${allocationId}/transactions`);
            expect(response.status).toBe(200);

            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
            expect(Array.isArray(body.data)).toBe(true);
        });

        it('deve buscar uma transação por ID', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/transactions/${transactionId}`);
            expect(response.status).toBe(200);

            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
            expect((body.data as AnyRecord).id).toBe(transactionId);
        });

        it('deve deletar uma transação', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/transactions/${transactionId}`, {
                method: 'DELETE',
            });

            expect(response.status).toBe(204);
        });
    });

    // ============ TESTES DE SEGUROS ============
    describe('CRUD /insurances', () => {
        let clientId: string;
        let simulationId: string;
        let insuranceId: string;

        beforeAll(async () => {
            const insertedClient = await db
                .insert(clients)
                .values({
                    name: 'Insurance Test Client',
                    email: `insurance.test+${Date.now()}@example.com`,
                })
                .returning();
            clientId = insertedClient[0].id;

            const insertedSimulation = await db
                .insert(simulations)
                .values({
                    clientId,
                    name: 'Insurance Test Sim',
                    initialCapital: 50000,
                } as any)
                .returning();
            simulationId = insertedSimulation[0].id;

            // Criar seguro no beforeAll para testes subsequentes
            const insertedInsurance = await db
                .insert(insurances)
                .values({
                    simulationId,
                    type: 'vida',
                    description: 'Seguro de vida teste',
                    coverageAmount: 500000,
                    monthlyCost: 500,
                    startDate: new Date(),
                } as any)
                .returning();
            insuranceId = insertedInsurance[0].id;
        });

        afterAll(async () => {
            await db.delete(insurances).where(eq(insurances.simulationId, simulationId));
            await db.delete(simulations).where(eq(simulations.id, simulationId));
            await db.delete(clients).where(eq(clients.id, clientId));
        });

        it('deve criar um novo seguro', async () => {
            const insuranceData = {
                simulationId,
                type: 'invalidez',
                description: 'Seguro invalidez',
                coverageAmount: 300000,
                monthlyCost: 300,
                startDate: new Date().toISOString(),
            };

            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/insurances`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(insuranceData),
            });

            expect(response.status).toBe(201);
            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
        });

        it('deve listar seguros de uma simulação', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/simulations/${simulationId}/insurances`);
            expect(response.status).toBe(200);

            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
            expect(Array.isArray(body.data)).toBe(true);
        });

        it('deve buscar um seguro por ID', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/insurances/${insuranceId}`);
            expect(response.status).toBe(200);

            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
            expect((body.data as AnyRecord).id).toBe(insuranceId);
        });

        it('deve atualizar um seguro', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/insurances/${insuranceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coverageAmount: 600000 }),
            });

            expect(response.status).toBe(200);
            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
        });

        it('deve deletar um seguro', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/insurances/${insuranceId}`, {
                method: 'DELETE',
            });

            expect(response.status).toBe(204);
        });
    });

    // ============ TESTES DE PATRIMÔNIO REALIZADO ============
    describe('GET /clients/:clientId/realized', () => {
        let clientId: string;
        let simulationId: string;

        beforeAll(async () => {
            const insertedClient = await db
                .insert(clients)
                .values({
                    name: 'Realized Test Client',
                    email: `realized.test+${Date.now()}@example.com`,
                })
                .returning();
            clientId = insertedClient[0].id;

            const insertedSimulation = await db
                .insert(simulations)
                .values({
                    clientId,
                    name: 'Realized Test Sim',
                    initialCapital: 100000,
                } as any)
                .returning();
            simulationId = insertedSimulation[0].id;

            await db
                .insert(allocations)
                .values({
                    simulationId,
                    type: 'financeira',
                    description: 'Teste de alocação',
                    percentage: 100,
                    initialValue: 100000,
                    annualReturn: 0.1,
                } as any);
        });

        afterAll(async () => {
            await db.delete(allocations).where(eq(allocations.simulationId, simulationId));
            await db.delete(simulations).where(eq(simulations.id, simulationId));
            await db.delete(clients).where(eq(clients.id, clientId));
        });

        it('deve retornar o patrimônio realizado do cliente', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/clients/${clientId}/realized`);
            expect(response.status).toBe(200);

            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
            expect(body.data).toHaveProperty('clientId');
            expect(body.data).toHaveProperty('totalAssets');
            expect(body.data).toHaveProperty('allocations');
            expect(body.data).toHaveProperty('transactions');
            expect(body.data).toHaveProperty('insurances');
        });
    });

    // ============ TESTES DE COMPARAÇÃO DE SIMULAÇÕES ============
    describe('POST /clients/:clientId/compare', () => {
        let clientId: string;
        let simulationId1: string;
        let simulationId2: string;

        beforeAll(async () => {
            const insertedClient = await db
                .insert(clients)
                .values({
                    name: 'Comparison Test Client',
                    email: `comparison.test+${Date.now()}@example.com`,
                })
                .returning();
            clientId = insertedClient[0].id;

            const insertedSim1 = await db
                .insert(simulations)
                .values({
                    clientId,
                    name: 'Simulação Conservadora',
                    initialCapital: 100000,
                    yearsProjection: 5,
                } as any)
                .returning();
            simulationId1 = insertedSim1[0].id;

            const insertedSim2 = await db
                .insert(simulations)
                .values({
                    clientId,
                    name: 'Simulação Agressiva',
                    initialCapital: 100000,
                    yearsProjection: 5,
                } as any)
                .returning();
            simulationId2 = insertedSim2[0].id;
        });

        afterAll(async () => {
            await db.delete(simulations).where(eq(simulations.id, simulationId1));
            await db.delete(simulations).where(eq(simulations.id, simulationId2));
            await db.delete(clients).where(eq(clients.id, clientId));
        });

        it('deve comparar múltiplas simulações', async () => {
            // @ts-ignore
            const response: Response = await fetch(`${API_URL}/clients/${clientId}/compare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    simulationIds: [simulationId1, simulationId2],
                }),
            });

            expect(response.status).toBe(200);
            const body = (await response.json()) as AnyRecord;
            expect(body.success).toBe(true);
            expect(body.data).toHaveProperty('clientId');
            expect(body.data).toHaveProperty('comparisons');
            expect(Array.isArray((body.data as AnyRecord).comparisons)).toBe(true);
        });
    });
});