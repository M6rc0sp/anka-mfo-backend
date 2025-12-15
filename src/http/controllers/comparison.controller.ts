import { FastifyReply, FastifyRequest } from 'fastify';
import { ComparisonService } from '../../application/services/comparison.service';
import { clientIdParamSchema, compareSimulationsSchema } from '../../infra/http/schemas';

export class ComparisonController {
    constructor(private readonly comparisonService: ComparisonService) { }

    async execute(
        request: FastifyRequest<{ Params: { clientId: string }; Body: { simulationIds: string[] } }>,
        reply: FastifyReply
    ) {
        const { clientId } = clientIdParamSchema.parse(request.params);
        const { simulationIds } = compareSimulationsSchema.parse(request.body);

        try {
            const result = await this.comparisonService.compare(clientId, simulationIds);
            return reply.status(200).send({ success: true, data: result });
        } catch (error) {
            return reply.status(500).send({
                success: false,
                error: 'Erro ao comparar simulações',
            });
        }
    }
}
