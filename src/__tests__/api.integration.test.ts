import { describe, it, expect } from 'vitest';

type AnyRecord = Record<string, unknown>;

describe('Clients API (Integration Tests)', () => {
    const API_URL = 'http://localhost:3333';

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
});
