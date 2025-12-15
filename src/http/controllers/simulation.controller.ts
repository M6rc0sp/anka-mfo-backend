import { FastifyReply, FastifyRequest } from 'fastify';
import { SimulationService } from '../../application/services/simulation.service';
import { clientIdParamSchema, idParamSchema } from '../../infra/http/schemas';

export class SimulationController {
    constructor(private readonly simulationService: SimulationService) { }

    async listByClient(
        request: FastifyRequest<{ Params: { clientId: string } }>,
        reply: FastifyReply
    ) {
        const { clientId } = clientIdParamSchema.parse(request.params);
        const simulations = await this.simulationService.findByClientId(clientId);
        return reply.send({ success: true, data: simulations });
    }

    async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = idParamSchema.parse(request.params);

        try {
            const simulation = await this.simulationService.findById(id);
            return reply.send({ success: true, data: simulation });
        } catch (error) {
            return reply.status(404).send({ success: false, error: 'Simulação não encontrada' });
        }
    }

    async createVersion(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = idParamSchema.parse(request.params);
        try {
            const version = await this.simulationService.createVersion(id);
            return reply.status(201).send({ success: true, data: version });
        } catch (error) {
            return reply.status(404).send({ success: false, error: 'Simulação não encontrada' });
        }
    }

    async listVersions(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = idParamSchema.parse(request.params);
        try {
            const versions = await this.simulationService.listVersions(id);
            return reply.send({ success: true, data: versions });
        } catch (error) {
            return reply.status(404).send({ success: false, error: 'Simulação não encontrada' });
        }
    }
}
