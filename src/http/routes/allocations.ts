import { FastifyInstance } from 'fastify';
import { IRepositories } from '../../infra/repositories/interfaces';
import { AllocationService } from '../../application/services/allocation.service';
import { AllocationController } from '../controllers/allocation.controller';

const createService = (repositories: IRepositories) =>
    new AllocationService(repositories.allocation);

export async function registerAllocationRoutes(app: FastifyInstance, repositories: IRepositories) {
    const controller = new AllocationController(createService(repositories));

    // Listar alocações por simulação
    app.get<{ Params: { simulationId: string } }>(
        '/simulations/:simulationId/allocations',
        {
            schema: {
                description: 'Lista todas as alocações de uma simulação',
                summary: 'Listar Alocações',
                tags: ['Alocações'],
                params: {
                    type: 'object',
                    required: ['simulationId'],
                    properties: {
                        simulationId: { type: 'string', format: 'uuid' },
                    },
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
                                        id: { type: 'string', format: 'uuid' },
                                        simulationId: { type: 'string', format: 'uuid' },
                                        type: { type: 'string' },
                                        description: { type: 'string' },
                                        percentage: { type: 'number' },
                                        initialValue: { type: 'number' },
                                        annualReturn: { type: 'number' },
                                    },
                                },
                            },
                        },
                        required: ['success', 'data'],
                    },
                },
            },
        },
        (request, reply) => controller.findBySimulationId(request, reply)
    );

    // Buscar alocação por ID
    app.get<{ Params: { id: string } }>(
        '/allocations/:id',
        {
            schema: {
                description: 'Busca uma alocação pelo ID',
                summary: 'Buscar Alocação',
                tags: ['Alocações'],
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
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

    // Criar alocação
    app.post<{ Body: unknown }>(
        '/allocations',
        {
            schema: {
                description: 'Cria uma nova alocação',
                summary: 'Criar Alocação',
                tags: ['Alocações'],
                body: {
                    type: 'object',
                    required: ['simulationId', 'type', 'description', 'percentage', 'initialValue'],
                    properties: {
                        simulationId: { type: 'string', format: 'uuid' },
                        type: { type: 'string', enum: ['financeira', 'imovel'] },
                        description: { type: 'string', minLength: 1, maxLength: 255 },
                        percentage: { type: 'number', minimum: 0, maximum: 100 },
                        initialValue: { type: 'number', minimum: 0 },
                        annualReturn: { type: 'number' },
                    },
                },
                response: {
                    201: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: { type: 'object', additionalProperties: true },
                        },
                        required: ['success', 'data'],
                    },
                    400: {
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
        (request, reply) => controller.create(request, reply)
    );

    // Atualizar alocação
    app.put<{ Params: { id: string }; Body: unknown }>(
        '/allocations/:id',
        {
            schema: {
                description: 'Atualiza uma alocação existente',
                summary: 'Atualizar Alocação',
                tags: ['Alocações'],
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
                body: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['financeira', 'imovel'] },
                        description: { type: 'string', minLength: 1, maxLength: 255 },
                        percentage: { type: 'number', minimum: 0, maximum: 100 },
                        initialValue: { type: 'number', minimum: 0 },
                        annualReturn: { type: 'number' },
                    },
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
        (request, reply) => controller.update(request, reply)
    );

    // Deletar alocação
    app.delete<{ Params: { id: string } }>(
        '/allocations/:id',
        {
            schema: {
                description: 'Remove uma alocação',
                summary: 'Deletar Alocação',
                tags: ['Alocações'],
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
                response: {
                    204: {
                        type: 'null',
                        description: 'Alocação removida com sucesso',
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
        (request, reply) => controller.delete(request, reply)
    );
}
