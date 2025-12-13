import { db } from '../../db/connect';
import { transactions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import {
    Transaction,
    CreateTransactionInput,
    NotFoundError,
    InvalidInputError,
} from '../../domain/entities';
import { ITransactionRepository } from './interfaces';

export class TransactionRepository implements ITransactionRepository {
    async create(input: CreateTransactionInput): Promise<Transaction> {
        if (!input.allocationId) {
            throw new InvalidInputError('ID da alocação é obrigatório');
        }

        if (!input.type || input.type.trim() === '') {
            throw new InvalidInputError('Tipo de movimentação é obrigatório');
        }

        if (input.amount <= 0) {
            throw new InvalidInputError('Valor deve ser maior que zero');
        }

        if (!(input as any).transactionDate) {
            throw new InvalidInputError('Data é obrigatória');
        }

        try {
            const insertData: Record<string, any> = {
                allocationId: input.allocationId,
                type: input.type as 'aporte' | 'resgate' | 'rendimento' | 'taxa',
                amount: input.amount,
                transactionDate: input.transactionDate,
                description: input.description || null,
            };

            const result = await db.insert(transactions).values(insertData as any).returning();

            return mapToTransaction(result[0]);
        } catch (error: any) {
            if (error.code === '23503') {
                throw new InvalidInputError('Alocação não encontrada');
            }
            throw error;
        }
    }

    async findById(id: string): Promise<Transaction | null> {
        const result = await db
            .select()
            .from(transactions)
            .where(eq(transactions.id, id));

        if (result.length === 0) {
            return null;
        }

        return mapToTransaction(result[0]);
    }

    async findByAllocationId(allocationId: string): Promise<Transaction[]> {
        const results = await db
            .select()
            .from(transactions)
            .where(eq(transactions.allocationId, allocationId));

        return results.map(mapToTransaction);
    }

    async findAll(): Promise<Transaction[]> {
        const results = await db.select().from(transactions);
        return results.map(mapToTransaction);
    }

    async update(id: string, input: Partial<CreateTransactionInput>): Promise<Transaction> {
        const existing = await this.findById(id);

        if (!existing) {
            throw new NotFoundError('Transaction', id);
        }

        const updateData: Record<string, any> = {
            updatedAt: new Date(),
        };

        if (input.type !== undefined) {
            if (input.type.trim() === '') {
                throw new InvalidInputError('Tipo não pode ser vazio');
            }
            updateData.type = input.type;
        }

        if (input.amount !== undefined) {
            if (input.amount <= 0) {
                throw new InvalidInputError('Valor deve ser maior que zero');
            }
            updateData.amount = input.amount;
        }

        if ((input as any).transactionDate !== undefined || (input as any).date !== undefined) {
            updateData.transactionDate = (input as any).transactionDate ?? (input as any).date;
        }

        if (input.description !== undefined) {
            updateData.description = input.description;
        }

        const result = await db
            .update(transactions)
            .set(updateData)
            .where(eq(transactions.id, id))
            .returning();

        return mapToTransaction(result[0]);
    }

    async delete(id: string): Promise<boolean> {
        const result = await db
            .delete(transactions)
            .where(eq(transactions.id, id))
            .returning();

        return result.length > 0;
    }
}

function mapToTransaction(data: any): Transaction {
    return {
        id: data.id,
        allocationId: data.allocationId,
        type: data.type,
        amount: data.amount,
        transactionDate: data.transactionDate,
        description: data.description,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
}
