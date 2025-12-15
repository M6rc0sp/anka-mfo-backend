import { FastifyInstance } from 'fastify';
import { IRepositories } from '../../infra/repositories/interfaces';
import { SimulationService } from '../../application/services/simulation.service';
import { SimulationController } from '../controllers/simulation.controller';

const createService = (repositories: IRepositories) =>
    new SimulationService(repositories.simulation, repositories.simulationVersion);

export async function registerSimulationRoutes(app: FastifyInstance, repositories: IRepositories) {
    const controller = new SimulationController(createService(repositories));

    app.get<{ Params: { clientId: string } }>(
        '/clients/:clientId/simulations',
        {
            schema: {
                description: 'Listar simulações de um cliente',
                tags: ['Simulações'],
                params: {
                    type: 'object',
                    properties: {
                        clientId: { type: 'string', format: 'uuid' },
                    },
                    required: ['clientId'],
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: {
                                type: 'array',
                                items: { type: 'object' },
                            },
                        },
                        required: ['success', 'data'],
                    },
                },
            },
        },
        (request, reply) => controller.listByClient(request, reply)
    );

    app.get<{ Params: { id: string } }>(
        '/simulations/:id',
        {
            schema: {
                description: 'Buscar simulação por ID',
                tags: ['Simulações'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                    required: ['id'],
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: { type: 'object', additionalProperties: true },
                        },
                        required: ['success', 'data'],
                    },
                    404: {
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
        (request, reply) => controller.findById(request, reply)
    );

    app.post<{ Params: { id: string } }>(
        '/simulations/:id/versions',
        {
            schema: {
                description: 'Criar nova versão da simulação',
                tags: ['Simulações'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                    required: ['id'],
                },
                response: {
                    201: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    simulationId: { type: 'string' },
                                    versionNumber: { type: 'number' },
                                    createdAt: { type: 'string', format: 'date-time' },
                                },
                            },
                        },
                        required: ['success', 'data'],
                    },
                    404: {
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
        (request, reply) => controller.createVersion(request, reply)
    );

    app.get<{ Params: { id: string } }>(
        '/simulations/:id/versions',
        {
            schema: {
                description: 'Listar versões da simulação',
                tags: ['Simulações'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                    required: ['id'],
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        versionNumber: { type: 'number' },
                                        snapshot: { type: 'object' },
                                        createdAt: { type: 'string', format: 'date-time' },
                                    },
                                },
                            },
                        },
                        required: ['success', 'data'],
                    },
                },
            },
        },
        (request, reply) => controller.listVersions(request, reply)
    );
}
