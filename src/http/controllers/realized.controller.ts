import { FastifyReply, FastifyRequest } from 'fastify';
import { RealizedService } from '../../application/services/realized.service';
import { clientIdParamSchema } from '../../infra/http/schemas';

export class RealizedController {
    constructor(private readonly realizedService: RealizedService) { }

    async execute(
        request: FastifyRequest<{ Params: { clientId: string } }>,
        reply: FastifyReply
    ) {
        const { clientId } = clientIdParamSchema.parse(request.params);

        try {
            const result = await this.realizedService.calcular(clientId);
            return reply.status(200).send({ success: true, data: result });
        } catch (error) {
            return reply.status(500).send({
                success: false,
                error: 'Erro ao calcular patrimônio realizado',
            });
        }
    }
}
