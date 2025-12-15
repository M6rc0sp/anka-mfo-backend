import { FastifyReply, FastifyRequest } from 'fastify';
import { TransactionService } from '../../application/services/transaction.service';
import { idParamSchema, createTransactionSchema, updateTransactionSchema } from '../../infra/http/schemas';
import { TipoMovimentacao } from '../../domain/entities';

export class TransactionController {
    constructor(private readonly transactionService: TransactionService) { }

    async findById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const { id } = idParamSchema.parse(request.params);

        try {
            const transaction = await this.transactionService.findById(id);
            return reply.send({ success: true, data: transaction });
        } catch (error) {
            return reply.status(404).send({ success: false, error: 'Transação não encontrada' });
        }
    }

    async findByAllocationId(
        request: FastifyRequest<{ Params: { allocationId: string } }>,
        reply: FastifyReply
    ) {
        const { allocationId } = request.params;
        const transactions = await this.transactionService.findByAllocationId(allocationId);
        return reply.send({ success: true, data: transactions });
    }

    async create(
        request: FastifyRequest<{ Body: unknown }>,
        reply: FastifyReply
    ) {
        const data = createTransactionSchema.parse(request.body);

        try {
            const transaction = await this.transactionService.create({
                allocationId: data.allocationId,
                type: data.type as TipoMovimentacao,
                amount: data.amount,
                description: data.description,
                transactionDate: new Date(data.transactionDate),
            });
            return reply.status(201).send({ success: true, data: transaction });
        } catch (error) {
            return reply.status(400).send({ success: false, error: 'Erro ao criar transação' });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
        reply: FastifyReply
    ) {
        const { id } = idParamSchema.parse(request.params);
        const data = updateTransactionSchema.parse(request.body);

        try {
            const transaction = await this.transactionService.update(id, data as any);
            return reply.send({ success: true, data: transaction });
        } catch (error) {
            return reply.status(404).send({ success: false, error: 'Transação não encontrada' });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const { id } = idParamSchema.parse(request.params);

        try {
            await this.transactionService.delete(id);
            return reply.status(204).send();
        } catch (error) {
            return reply.status(404).send({ success: false, error: 'Transação não encontrada' });
        }
    }
}
