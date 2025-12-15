import { describe, expect, it, vi } from 'vitest';
import { SimulationController } from '../simulation.controller';

const buildReply = () => {
    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });
    return { status, send };
};

describe('SimulationController', () => {
    it('lista simulações do cliente', async () => {
        const service = { findByClientId: vi.fn().mockResolvedValue([{ id: 'sim-1' }]) };
        const controller = new SimulationController(service as any);
        const reply = buildReply();

        await controller.listByClient({ params: { clientId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' } } as any, reply as any);

        expect(service.findByClientId).toHaveBeenCalledWith('a1b2c3d4-e5f6-7890-1234-567890abcdef');
        expect(reply.send).toHaveBeenCalledWith({ success: true, data: [{ id: 'sim-1' }] });
    });

    it('retorna 404 quando simulação não existe', async () => {
        const service = { findById: vi.fn().mockRejectedValue(new Error('not found')) };
        const controller = new SimulationController(service as any);
        const reply = buildReply();

        await controller.findById({ params: { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' } } as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(404);
        expect(reply.send).toHaveBeenCalledWith({
            success: false,
            error: 'Simulação não encontrada',
        });
    });

    it('cria versão da simulação', async () => {
        const service = { createVersion: vi.fn().mockResolvedValue({ versionNumber: 1 }) };
        const controller = new SimulationController(service as any);
        const reply = buildReply();

        await controller.createVersion({ params: { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' } } as any, reply as any);

        expect(service.createVersion).toHaveBeenCalledWith('a1b2c3d4-e5f6-7890-1234-567890abcdef');
        expect(reply.status).toHaveBeenCalledWith(201);
        expect(reply.send).toHaveBeenCalledWith({ success: true, data: { versionNumber: 1 } });
    });

    it('lista versões da simulação', async () => {
        const service = { listVersions: vi.fn().mockResolvedValue([{ versionNumber: 1 }]) };
        const controller = new SimulationController(service as any);
        const reply = buildReply();

        await controller.listVersions({ params: { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' } } as any, reply as any);

        expect(service.listVersions).toHaveBeenCalledWith('a1b2c3d4-e5f6-7890-1234-567890abcdef');
        expect(reply.send).toHaveBeenCalledWith({ success: true, data: [{ versionNumber: 1 }] });
    });
});
