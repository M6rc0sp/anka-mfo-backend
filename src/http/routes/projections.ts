import { FastifyInstance } from 'fastify';
import { IRepositories } from '../../infra/repositories/interfaces';
import { ProjectionService } from '../../application/services/projection.service';
import { ProjectionController } from '../controllers/projection.controller';

type ProjectionQuery = {
    startDate?: string;
    endDate?: string;
    interestRate?: number;
    inflationRate?: number;
    lifeStatus?: string;
    lifeStatusChangeDate?: string;
};

const projectionServiceFactory = (repositories: IRepositories) =>
    new ProjectionService(
        repositories.client,
        repositories.simulation,
        repositories.allocation,
        repositories.transaction,
        repositories.insurance
    );

export async function registerProjectionRoutes(app: FastifyInstance, repositories: IRepositories) {
    const projectionService = projectionServiceFactory(repositories);
    const controller = new ProjectionController(projectionService, repositories.simulation);

    app.get<
        {
            Params: { id: string };
            Querystring: ProjectionQuery;
        }
    >(
        '/simulations/:id/projection',
        {
            schema: {
                description: 'Executa o motor de projeção com base na simulação informada',
                summary: 'Projeção financeira',
                tags: ['Simulações', 'Projeções'],
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
                querystring: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time' },
                        interestRate: { type: 'number', minimum: 0, maximum: 1 },
                        inflationRate: { type: 'number', minimum: 0, maximum: 1 },
                        lifeStatus: { type: 'string', enum: ['normal', 'dead', 'invalid', 'vivo', 'falecido', 'incapacidade'] },
                        lifeStatusChangeDate: { type: 'string', format: 'date-time' },
                    },
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            monthly: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        date: { type: 'string', format: 'date-time' },
                                        financialAssets: { type: 'number' },
                                        propertyAssets: { type: 'number' },
                                        totalAssets: { type: 'number' },
                                        totalWithoutInsurance: { type: 'number' },
                                        entries: { type: 'number' },
                                        exits: { type: 'number' },
                                        insurancePremiums: { type: 'number' },
                                        insurancePayouts: { type: 'number' },
                                        financingPayments: { type: 'number' },
                                    },
                                    required: [
                                        'date',
                                        'financialAssets',
                                        'propertyAssets',
                                        'totalAssets',
                                        'totalWithoutInsurance',
                                        'entries',
                                        'exits',
                                        'insurancePremiums',
                                        'insurancePayouts',
                                        'financingPayments',
                                    ],
                                },
                            },
                            yearly: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        year: { type: 'number' },
                                        financialAssets: { type: 'number' },
                                        propertyAssets: { type: 'number' },
                                        totalAssets: { type: 'number' },
                                    },
                                    required: ['year', 'financialAssets', 'propertyAssets', 'totalAssets'],
                                },
                            },
                            summary: {
                                type: 'object',
                                properties: {
                                    initialAssets: { type: 'number' },
                                    finalAssets: { type: 'number' },
                                    totalGrowth: { type: 'number' },
                                    totalGrowthPercent: { type: 'number' },
                                    totalEntries: { type: 'number' },
                                    totalExits: { type: 'number' },
                                    insuranceImpact: { type: 'number' },
                                },
                                required: [
                                    'initialAssets',
                                    'finalAssets',
                                    'totalGrowth',
                                    'totalGrowthPercent',
                                    'totalEntries',
                                    'totalExits',
                                    'insuranceImpact',
                                ],
                            },
                        },
                        required: ['monthly', 'yearly', 'summary'],
                    },
                    400: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            error: { type: 'string' },
                        },
                        required: ['success', 'error'],
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
        async (request, reply) => controller.execute(request, reply)
    );
}
