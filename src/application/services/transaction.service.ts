import { Transaction, CreateTransactionInput, NotFoundError } from '../../domain/entities';
import { ITransactionRepository } from '../../infra/repositories/interfaces';

export class TransactionService {
    constructor(private readonly transactionRepository: ITransactionRepository) { }

    async findById(id: string): Promise<Transaction> {
        const transaction = await this.transactionRepository.findById(id);
        if (!transaction) {
            throw new NotFoundError('Transaction', id);
        }
        return transaction;
    }

    async findByAllocationId(allocationId: string): Promise<Transaction[]> {
        return this.transactionRepository.findByAllocationId(allocationId);
    }

    async create(input: CreateTransactionInput): Promise<Transaction> {
        return this.transactionRepository.create(input);
    }

    async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
        await this.findById(id);
        return this.transactionRepository.update(id, data);
    }

    async delete(id: string): Promise<boolean> {
        await this.findById(id);
        return this.transactionRepository.delete(id);
    }
}
