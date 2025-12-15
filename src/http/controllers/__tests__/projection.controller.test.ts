import { describe, it, expect, vi } from 'vitest';
import { ProjectionController } from '../projection.controller';

describe('ProjectionController', () => {
    const buildReply = () => {
        const send = vi.fn();
        const status = vi.fn().mockReturnValue({ send });
        return { status, send };
    };

    it('retorna 404 quando a simulação não existe', async () => {
        const simulationRepo = { findById: vi.fn().mockResolvedValue(null) };
        const projectionService = { calcular: vi.fn() };
        const reply = buildReply();
        const controller = new ProjectionController(projectionService as any, simulationRepo as any);

        await controller.execute({ params: { id: 'missing' }, query: {} } as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(404);
        expect(reply.send).toHaveBeenCalledWith({
            success: false,
            error: 'Simulação não encontrada',
        });
        expect(projectionService.calcular).not.toHaveBeenCalled();
    });

    it('executa o motor quando os dados são válidos', async () => {
        const simulation = { id: 'sim-1', yearsProjection: 5, inflationRate: 0.03 };
        const projectionResponse = {
            monthly: [],
            yearly: [],
            summary: {
                initialAssets: 0,
                finalAssets: 0,
                totalGrowth: 0,
                totalGrowthPercent: 0,
                totalEntries: 0,
                totalExits: 0,
                insuranceImpact: 0,
            },
        };

        const simulationRepo = { findById: vi.fn().mockResolvedValue(simulation) };
        const projectionService = { calcular: vi.fn().mockResolvedValue(projectionResponse) };
        const controller = new ProjectionController(projectionService as any, simulationRepo as any);
        const reply = buildReply();

        const request = {
            params: { id: 'sim-1' },
            query: {
                startDate: '2025-01-01T00:00:00Z',
                endDate: '2026-01-01T00:00:00Z',
                interestRate: '0.08',
                inflationRate: '0.04',
                lifeStatus: 'vivo',
                lifeStatusChangeDate: '2025-06-01T00:00:00Z',
            },
        } as any;

        await controller.execute(request, reply as any);

        expect(projectionService.calcular).toHaveBeenCalledWith(
            'sim-1',
            expect.objectContaining({
                interestRate: 0.08,
                inflationRate: 0.04,
                lifeStatus: 'normal',
                lifeStatusChangeDate: expect.any(Date),
            })
        );
        expect(reply.status).toHaveBeenCalledWith(200);
        expect(reply.send).toHaveBeenCalledWith(projectionResponse);
    });
});
