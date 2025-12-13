import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { IClientRepository } from '../../infra/repositories/interfaces';

const createClientSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 000.000.000-00'),
    phone: z.string().min(10, 'Telefone inválido'),
    birthDate: z.string().datetime('Data inválida'),
    status: z.enum(['vivo', 'falecido', 'incapacidade']).default('vivo'),
});

const updateClientSchema = createClientSchema.partial();

const uuidSchema = z.string().uuid('ID inválido - deve ser um UUID válido');

export class ClientController {
    constructor(private clientRepository: IClientRepository) { }

    async create(request: FastifyRequest, reply: FastifyReply) {
        const data = createClientSchema.parse(request.body);

        const client = await this.clientRepository.create({
            name: data.name,
            email: data.email,
            cpf: data.cpf,
            phone: data.phone,
            birthdate: new Date(data.birthDate),
        });

        reply.status(201);
        return {
            success: true,
            data: {
                id: client.id,
                name: client.name,
                email: client.email,
                cpf: client.cpf,
                phone: client.phone,
                status: client.status,
            },
        };
    }

    async findById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };

        try {
            const validatedId = uuidSchema.parse(id);
            const client = await this.clientRepository.findById(validatedId);

            if (!client) {
                return reply.status(404).send({
                    success: false,
                    error: 'Cliente não encontrado',
                });
            }

            return reply.send({
                success: true,
                data: client,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message || 'UUID inválido',
            });
        }
    }

    async findAll(request: FastifyRequest, reply: FastifyReply) {
        void request;
        const clients = await this.clientRepository.findAll();

        return reply.send({
            success: true,
            data: clients,
            count: clients.length,
        });
    }

    async update(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const data = updateClientSchema.parse(request.body);

        const updateInput: any = {};

        if (data.name !== undefined) updateInput.name = data.name;
        if (data.email !== undefined) updateInput.email = data.email;
        if (data.cpf !== undefined) updateInput.cpf = data.cpf;
        if (data.phone !== undefined) updateInput.phone = data.phone;
        if (data.birthDate !== undefined) updateInput.birthdate = new Date(data.birthDate);

        const client = await this.clientRepository.update(id, updateInput);

        return reply.send({
            success: true,
            data: client,
        });
    }

    async delete(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };

        const deleted = await this.clientRepository.delete(id);

        if (!deleted) {
            return reply.status(404).send({
                success: false,
                error: 'Cliente não encontrado',
            });
        }

        return reply.send({
            success: true,
            message: 'Cliente deletado com sucesso',
        });
    }
}
