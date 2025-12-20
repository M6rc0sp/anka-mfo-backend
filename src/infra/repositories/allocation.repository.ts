import { db } from '../../db/connect';
import { allocations } from '../../db/schema';
import { eq } from 'drizzle-orm';
import {
    Allocation,
    CreateAllocationInput,
    NotFoundError,
    InvalidInputError,
    ConflictError,
} from '../../domain/entities';
import { IAllocationRepository } from './interfaces';

export class AllocationRepository implements IAllocationRepository {
    async create(input: CreateAllocationInput): Promise<Allocation> {
        if (!input.simulationId) {
            throw new InvalidInputError('ID da simulação é obrigatório');
        }

        if (!input.type || input.type.trim() === '') {
            throw new InvalidInputError('Tipo de alocação é obrigatório');
        }

        if (input.percentage < 0 || input.percentage > 100) {
            throw new InvalidInputError('Percentual deve estar entre 0 e 100');
        }

        if ((input as any).initialValue < 0) {
            throw new InvalidInputError('Valor não pode ser negativo');
        }

        try {
            const insertData: Record<string, any> = {
                simulationId: input.simulationId,
                type: input.type as 'financeira' | 'imovel',
                description: input.description || null,
                percentage: input.percentage,
                initialValue: (input as any).initialValue,
                annualReturn: (input as any).annualReturn ?? 0,
                allocationDate: (input as any).allocationDate ? new Date((input as any).allocationDate) : new Date(),
            };

            const result = await db.insert(allocations).values(insertData as any).returning();

            return mapToAllocation(result[0]);
        } catch (error: any) {
            if (error.code === '23505') {
                throw new ConflictError('Alocação duplicada');
            }
            if (error.code === '23503') {
                throw new InvalidInputError('Simulação não encontrada');
            }
            throw error;
        }
    }

    async findById(id: string): Promise<Allocation | null> {
        const result = await db
            .select()
            .from(allocations)
            .where(eq(allocations.id, id));

        if (result.length === 0) {
            return null;
        }

        return mapToAllocation(result[0]);
    }

    async findBySimulationId(simulationId: string): Promise<Allocation[]> {
        const results = await db
            .select()
            .from(allocations)
            .where(eq(allocations.simulationId, simulationId));

        return results.map(mapToAllocation);
    }

    async findAll(): Promise<Allocation[]> {
        const results = await db.select().from(allocations);
        return results.map(mapToAllocation);
    }

    async update(id: string, input: Partial<CreateAllocationInput>): Promise<Allocation> {
        const existing = await this.findById(id);

        if (!existing) {
            throw new NotFoundError('Allocation', id);
        }

        const updateData: Record<string, any> = {
            updatedAt: new Date(),
        };

        if ((input as any).type !== undefined) {
            if ((input as any).type.trim() === '') {
                throw new InvalidInputError('Tipo não pode ser vazio');
            }
            updateData.type = input.type;
        }

        if (input.description !== undefined) {
            updateData.description = input.description;
        }

        if (input.percentage !== undefined) {
            if (input.percentage < 0 || input.percentage > 100) {
                throw new InvalidInputError('Percentual deve estar entre 0 e 100');
            }
            updateData.percentage = input.percentage;
        }

        if ((input as any).initialValue !== undefined) {
            if ((input as any).initialValue < 0) {
                throw new InvalidInputError('Valor não pode ser negativo');
            }
            updateData.initialValue = (input as any).initialValue;
        }

        if ((input as any).annualReturn !== undefined) {
            if ((input as any).annualReturn < 0) {
                throw new InvalidInputError('Retorno esperado não pode ser negativo');
            }
            updateData.annualReturn = (input as any).annualReturn;
        }

        if ((input as any).allocationDate !== undefined) {
            updateData.allocationDate = new Date((input as any).allocationDate);
        }

        const result = await db
            .update(allocations)
            .set(updateData)
            .where(eq(allocations.id, id))
            .returning();

        return mapToAllocation(result[0]);
    }

    async delete(id: string): Promise<boolean> {
        const result = await db
            .delete(allocations)
            .where(eq(allocations.id, id))
            .returning();

        return result.length > 0;
    }
}

function mapToAllocation(data: any): Allocation {
    return {
        id: data.id,
        simulationId: data.simulationId,
        type: data.type,
        description: data.description,
        percentage: Number(data.percentage),
        initialValue: Number(data.initialValue),
        annualReturn: Number(data.annualReturn),
        allocationDate: data.allocationDate ? new Date(data.allocationDate).toISOString().split('T')[0] : null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
}
