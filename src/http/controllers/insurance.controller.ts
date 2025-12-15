import { FastifyReply, FastifyRequest } from 'fastify';
import { InsuranceService } from '../../application/services/insurance.service';
import { idParamSchema, createInsuranceSchema, updateInsuranceSchema } from '../../infra/http/schemas';

export class InsuranceController {
    constructor(private readonly insuranceService: InsuranceService) { }

    async findById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const { id } = idParamSchema.parse(request.params);

        try {
            const insurance = await this.insuranceService.findById(id);
            return reply.send({ success: true, data: insurance });
        } catch (error) {
            return reply.status(404).send({ success: false, error: 'Seguro não encontrado' });
        }
    }

    async findBySimulationId(
        request: FastifyRequest<{ Params: { simulationId: string } }>,
        reply: FastifyReply
    ) {
        const { simulationId } = request.params;
        const insurances = await this.insuranceService.findBySimulationId(simulationId);
        return reply.send({ success: true, data: insurances });
    }

    async create(
        request: FastifyRequest<{ Body: unknown }>,
        reply: FastifyReply
    ) {
        const data = createInsuranceSchema.parse(request.body);

        try {
            const insurance = await this.insuranceService.create({
                simulationId: data.simulationId,
                type: data.type,
                description: data.description,
                coverageAmount: data.coverageAmount,
                monthlyCost: data.monthlyCost,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            });
            return reply.status(201).send({ success: true, data: insurance });
        } catch (error) {
            return reply.status(400).send({ success: false, error: 'Erro ao criar seguro' });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
        reply: FastifyReply
    ) {
        const { id } = idParamSchema.parse(request.params);
        const data = updateInsuranceSchema.parse(request.body);

        try {
            const insurance = await this.insuranceService.update(id, data as any);
            return reply.send({ success: true, data: insurance });
        } catch (error) {
            return reply.status(404).send({ success: false, error: 'Seguro não encontrado' });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const { id } = idParamSchema.parse(request.params);

        try {
            await this.insuranceService.delete(id);
            return reply.status(204).send();
        } catch (error) {
            return reply.status(404).send({ success: false, error: 'Seguro não encontrado' });
        }
    }
}
