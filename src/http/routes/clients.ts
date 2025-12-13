import { FastifyInstance } from 'fastify';
import { IRepositories } from '../../infra/repositories/interfaces';
import { ClientController } from '../controllers/client.controller';

export async function registerClientRoutes(app: FastifyInstance, repositories: IRepositories) {
    const clientController = new ClientController(repositories.client);

    app.post<{ Body: any }>(
        '/clients',
        {
            schema: {
                description: 'Criar novo cliente',
                tags: ['Clientes'],
                body: {
                    type: 'object',
                    required: ['name', 'email', 'cpf', 'phone', 'birthDate'],
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        cpf: { type: 'string' },
                        phone: { type: 'string' },
                        birthDate: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['vivo', 'falecido', 'incapacidade'] },
                    },
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
                                    name: { type: 'string' },
                                    email: { type: 'string' },
                                    cpf: { type: 'string' },
                                    phone: { type: 'string' },
                                    status: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
        (request, reply) => clientController.create(request, reply)
    );

    app.get<{ Params: { id: string } }>(
        '/clients/:id',
        {
            schema: {
                description: 'Buscar cliente por ID',
                tags: ['Clientes'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
            },
        },
        (request, reply) => clientController.findById(request, reply)
    );

    app.get(
        '/clients',
        {
            schema: {
                description: 'Listar todos os clientes',
                tags: ['Clientes'],
            },
        },
        (request, reply) => clientController.findAll(request, reply)
    );

    app.put<{ Params: { id: string }; Body: any }>(
        '/clients/:id',
        {
            schema: {
                description: 'Atualizar cliente',
                tags: ['Clientes'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
            },
        },
        (request, reply) => clientController.update(request, reply)
    );

    app.delete<{ Params: { id: string } }>(
        '/clients/:id',
        {
            schema: {
                description: 'Deletar cliente',
                tags: ['Clientes'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
            },
        },
        (request, reply) => clientController.delete(request, reply)
    );
}
