import { FastifyInstance } from 'fastify';
import { IRepositories } from '../../infra/repositories/interfaces';
import { InsuranceService } from '../../application/services/insurance.service';
import { InsuranceController } from '../controllers/insurance.controller';

const createService = (repositories: IRepositories) =>
    new InsuranceService(repositories.insurance);

export async function registerInsuranceRoutes(app: FastifyInstance, repositories: IRepositories) {
    const controller = new InsuranceController(createService(repositories));

    // Listar seguros por simulação
    app.get<{ Params: { simulationId: string } }>(
        '/simulations/:simulationId/insurances',
        {
            schema: {
                description: 'Lista todos os seguros de uma simulação',
                summary: 'Listar Seguros',
                tags: ['Seguros'],
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
                                        coverageAmount: { type: 'number' },
                                        monthlyCost: { type: 'number' },
                                        startDate: { type: 'string', format: 'date-time' },
                                        endDate: { type: 'string', format: 'date-time' },
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

    // Buscar seguro por ID
    app.get<{ Params: { id: string } }>(
        '/insurances/:id',
        {
            schema: {
                description: 'Busca um seguro pelo ID',
                summary: 'Buscar Seguro',
                tags: ['Seguros'],
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

    // Criar seguro
    app.post<{ Body: unknown }>(
        '/insurances',
        {
            schema: {
                description: 'Cria um novo seguro',
                summary: 'Criar Seguro',
                tags: ['Seguros'],
                body: {
                    type: 'object',
                    required: ['simulationId', 'type', 'coverageAmount', 'monthlyCost', 'startDate'],
                    properties: {
                        simulationId: { type: 'string', format: 'uuid' },
                        type: { type: 'string', minLength: 1, maxLength: 50 },
                        description: { type: 'string' },
                        coverageAmount: { type: 'number', minimum: 0 },
                        monthlyCost: { type: 'number', minimum: 0 },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time' },
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

    // Atualizar seguro
    app.put<{ Params: { id: string }; Body: unknown }>(
        '/insurances/:id',
        {
            schema: {
                description: 'Atualiza um seguro existente',
                summary: 'Atualizar Seguro',
                tags: ['Seguros'],
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
                        type: { type: 'string', minLength: 1, maxLength: 50 },
                        description: { type: 'string' },
                        coverageAmount: { type: 'number', minimum: 0 },
                        monthlyCost: { type: 'number', minimum: 0 },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time' },
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

    // Deletar seguro
    app.delete<{ Params: { id: string } }>(
        '/insurances/:id',
        {
            schema: {
                description: 'Remove um seguro',
                summary: 'Deletar Seguro',
                tags: ['Seguros'],
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
                        description: 'Seguro removido com sucesso',
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
