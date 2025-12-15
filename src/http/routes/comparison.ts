import { FastifyInstance } from 'fastify';
import { IRepositories } from '../../infra/repositories/interfaces';
import { ComparisonService } from '../../application/services/comparison.service';
import { ComparisonController } from '../controllers/comparison.controller';
import { ProjectionService } from '../../application/services/projection.service';

const createService = (repositories: IRepositories) => {
    const projectionService = new ProjectionService(
        repositories.client,
        repositories.simulation,
        repositories.allocation,
        repositories.transaction,
        repositories.insurance
    );
    return new ComparisonService(repositories.simulation, projectionService);
};

export async function registerComparisonRoutes(app: FastifyInstance, repositories: IRepositories) {
    const controller = new ComparisonController(createService(repositories));

    app.post<{ Params: { clientId: string }; Body: { simulationIds: string[] } }>(
        '/clients/:clientId/compare',
        {
            schema: {
                description: 'Compara múltiplas simulações de um cliente executando projeções para cada uma',
                summary: 'Comparar Simulações',
                tags: ['Clientes', 'Comparação'],
                params: {
                    type: 'object',
                    required: ['clientId'],
                    properties: {
                        clientId: { type: 'string', format: 'uuid' },
                    },
                },
                body: {
                    type: 'object',
                    required: ['simulationIds'],
                    properties: {
                        simulationIds: {
                            type: 'array',
                            items: { type: 'string', format: 'uuid' },
                            minItems: 1,
                            maxItems: 5,
                        },
                    },
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: {
                                type: 'object',
                                properties: {
                                    clientId: { type: 'string', format: 'uuid' },
                                    comparisons: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                simulationId: { type: 'string', format: 'uuid' },
                                                name: { type: 'string' },
                                                projection: { type: 'object' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        required: ['success', 'data'],
                    },
                    500: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            error: { type: 'string' },
                        },
                        required: ['success', 'error'],
                    },
                },
            },
        },
        (request, reply) => controller.execute(request, reply)
    );
}
