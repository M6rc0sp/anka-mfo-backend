import { FastifyInstance } from 'fastify';
import { IRepositories } from '../../infra/repositories/interfaces';
import { TransactionService } from '../../application/services/transaction.service';
import { TransactionController } from '../controllers/transaction.controller';

const createService = (repositories: IRepositories) =>
    new TransactionService(repositories.transaction);

export async function registerTransactionRoutes(app: FastifyInstance, repositories: IRepositories) {
    const controller = new TransactionController(createService(repositories));

    // Listar transações por alocação
    app.get<{ Params: { allocationId: string } }>(
        '/allocations/:allocationId/transactions',
        {
            schema: {
                description: 'Lista todas as transações de uma alocação',
                summary: 'Listar Transações',
                tags: ['Transações'],
                params: {
                    type: 'object',
                    required: ['allocationId'],
                    properties: {
                        allocationId: { type: 'string', format: 'uuid' },
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
                                        allocationId: { type: 'string', format: 'uuid' },
                                        type: { type: 'string' },
                                        amount: { type: 'number' },
                                        description: { type: 'string' },
                                        transactionDate: { type: 'string', format: 'date-time' },
                                    },
                                },
                            },
                        },
                        required: ['success', 'data'],
                    },
                },
            },
        },
        (request, reply) => controller.findByAllocationId(request, reply)
    );

    // Buscar transação por ID
    app.get<{ Params: { id: string } }>(
        '/transactions/:id',
        {
            schema: {
                description: 'Busca uma transação pelo ID',
                summary: 'Buscar Transação',
                tags: ['Transações'],
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

    // Criar transação
    app.post<{ Body: unknown }>(
        '/transactions',
        {
            schema: {
                description: 'Cria uma nova transação',
                summary: 'Criar Transação',
                tags: ['Transações'],
                body: {
                    type: 'object',
                    required: ['allocationId', 'type', 'amount', 'transactionDate'],
                    properties: {
                        allocationId: { type: 'string', format: 'uuid' },
                        type: { type: 'string', enum: ['aporte', 'resgate', 'rendimento', 'taxa'] },
                        amount: { type: 'number', minimum: 0 },
                        description: { type: 'string' },
                        transactionDate: { type: 'string', format: 'date-time' },
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

    // Atualizar transação
    app.put<{ Params: { id: string }; Body: unknown }>(
        '/transactions/:id',
        {
            schema: {
                description: 'Atualiza uma transação existente',
                summary: 'Atualizar Transação',
                tags: ['Transações'],
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
                        type: { type: 'string', enum: ['aporte', 'resgate', 'rendimento', 'taxa'] },
                        amount: { type: 'number', minimum: 0 },
                        description: { type: 'string' },
                        transactionDate: { type: 'string', format: 'date-time' },
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

    // Deletar transação
    app.delete<{ Params: { id: string } }>(
        '/transactions/:id',
        {
            schema: {
                description: 'Remove uma transação',
                summary: 'Deletar Transação',
                tags: ['Transações'],
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
                        description: 'Transação removida com sucesso',
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
