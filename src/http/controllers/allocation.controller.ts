import { FastifyReply, FastifyRequest } from 'fastify';
import { AllocationService } from '../../application/services/allocation.service';
import { idParamSchema, createAllocationSchema, updateAllocationSchema } from '../../infra/http/schemas';
import { TipoAlocacao } from '../../domain/entities';

export class AllocationController {
    constructor(private readonly allocationService: AllocationService) { }

    async findById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const { id } = idParamSchema.parse(request.params);

        try {
            const allocation = await this.allocationService.findById(id);
            return reply.send({ success: true, data: allocation });
        } catch (error) {
            return reply.status(404).send({ success: false, error: 'Alocação não encontrada' });
        }
    }

    async findBySimulationId(
        request: FastifyRequest<{ Params: { simulationId: string } }>,
        reply: FastifyReply
    ) {
        const { simulationId } = request.params;
        const allocations = await this.allocationService.findBySimulationId(simulationId);
        return reply.send({ success: true, data: allocations });
    }

    async create(
        request: FastifyRequest<{ Body: unknown }>,
        reply: FastifyReply
    ) {
        const data = createAllocationSchema.parse(request.body);

        try {
            const allocation = await this.allocationService.create({
                simulationId: data.simulationId,
                type: data.type as TipoAlocacao,
                description: data.description,
                percentage: data.percentage,
                initialValue: data.initialValue,
                annualReturn: data.annualReturn,
                allocationDate: data.allocationDate,
            } as any);
            return reply.status(201).send({ success: true, data: allocation });
        } catch (error) {
            return reply.status(400).send({ success: false, error: 'Erro ao criar alocação' });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
        reply: FastifyReply
    ) {
        const { id } = idParamSchema.parse(request.params);
        const data = updateAllocationSchema.parse(request.body);

        try {
            const allocation = await this.allocationService.update(id, data as any);
            return reply.send({ success: true, data: allocation });
        } catch (error) {
            return reply.status(404).send({ success: false, error: 'Alocação não encontrada' });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const { id } = idParamSchema.parse(request.params);

        try {
            await this.allocationService.delete(id);
            return reply.status(204).send();
        } catch (error) {
            return reply.status(404).send({ success: false, error: 'Alocação não encontrada' });
        }
    }
}
