import { FastifyInstance } from 'fastify';
import { IRepositories } from '../../infra/repositories/interfaces';
import { RealizedService } from '../../application/services/realized.service';
import { RealizedController } from '../controllers/realized.controller';

const createService = (repositories: IRepositories) =>
    new RealizedService(
        repositories.simulation,
        repositories.allocation,
        repositories.transaction,
        repositories.insurance
    );

export async function registerRealizedRoutes(app: FastifyInstance, repositories: IRepositories) {
    const controller = new RealizedController(createService(repositories));

    app.get<{ Params: { clientId: string } }>(
        '/clients/:clientId/realized',
        {
            schema: {
                description: 'Calcula o patrimônio realizado do cliente com base em alocações, transações e seguros',
                summary: 'Patrimônio Realizado',
                tags: ['Clientes', 'Patrimônio'],
                params: {
                    type: 'object',
                    required: ['clientId'],
                    properties: {
                        clientId: { type: 'string', format: 'uuid' },
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
                                    totalAssets: { type: 'number' },
                                    allocations: {
                                        type: 'object',
                                        properties: {
                                            total: { type: 'number' },
                                            financial: { type: 'number' },
                                            property: { type: 'number' },
                                        },
                                    },
                                    transactions: {
                                        type: 'object',
                                        properties: {
                                            totalEntries: { type: 'number' },
                                            totalExits: { type: 'number' },
                                            perType: {
                                                type: 'object',
                                                properties: {
                                                    aporte: { type: 'number' },
                                                    resgate: { type: 'number' },
                                                    rendimento: { type: 'number' },
                                                    taxa: { type: 'number' },
                                                },
                                            },
                                        },
                                    },
                                    insurances: {
                                        type: 'object',
                                        properties: {
                                            count: { type: 'number' },
                                            totalMonthlyCost: { type: 'number' },
                                            totalCoverage: { type: 'number' },
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
