import { db } from '../../db/connect';
import { insurances } from '../../db/schema';
import { eq } from 'drizzle-orm';
import {
    Insurance,
    CreateInsuranceInput,
    NotFoundError,
    InvalidInputError,
} from '../../domain/entities';
import { IInsuranceRepository } from './interfaces';

export class InsuranceRepository implements IInsuranceRepository {
    async create(input: CreateInsuranceInput): Promise<Insurance> {
        if (!input.simulationId) {
            throw new InvalidInputError('ID da simulação é obrigatório');
        }

        if (!input.type || input.type.trim() === '') {
            throw new InvalidInputError('Tipo de seguro é obrigatório');
        }

        if ((input as any).monthlyCost < 0) {
            throw new InvalidInputError('Custo não pode ser negativo');
        }

        if (!input.startDate) {
            throw new InvalidInputError('Data de início é obrigatória');
        }

        try {
            const insertData: Record<string, any> = {
                simulationId: input.simulationId,
                type: input.type,
                coverageAmount: (input as any).coverageAmount,
                monthlyCost: (input as any).monthlyCost,
                startDate: input.startDate,
                endDate: input.endDate ?? null,
            };

            const result = await db.insert(insurances).values(insertData as any).returning();

            return mapToInsurance(result[0]);
        } catch (error: any) {
            if (error.code === '23503') {
                throw new InvalidInputError('Simulação não encontrada');
            }
            throw error;
        }
    }

    async findById(id: string): Promise<Insurance | null> {
        const result = await db
            .select()
            .from(insurances)
            .where(eq(insurances.id, id));

        if (result.length === 0) {
            return null;
        }

        return mapToInsurance(result[0]);
    }

    async findBySimulationId(simulationId: string): Promise<Insurance[]> {
        const results = await db
            .select()
            .from(insurances)
            .where(eq(insurances.simulationId, simulationId));

        return results.map(mapToInsurance);
    }

    async findAll(): Promise<Insurance[]> {
        const results = await db.select().from(insurances);
        return results.map(mapToInsurance);
    }

    async update(id: string, input: Partial<CreateInsuranceInput>): Promise<Insurance> {
        const existing = await this.findById(id);

        if (!existing) {
            throw new NotFoundError('Insurance', id);
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

        if ((input as any).coverageAmount !== undefined) {
            updateData.coverageAmount = (input as any).coverageAmount;
        }

        if ((input as any).monthlyCost !== undefined) {
            if ((input as any).monthlyCost < 0) {
                throw new InvalidInputError('Custo não pode ser negativo');
            }
            updateData.monthlyCost = (input as any).monthlyCost;
        }

        if (input.endDate !== undefined) {
            updateData.endDate = input.endDate;
        }

        // isActive not part of domain model/schema — ignore

        const result = await db
            .update(insurances)
            .set(updateData)
            .where(eq(insurances.id, id))
            .returning();

        return mapToInsurance(result[0]);
    }

    async delete(id: string): Promise<boolean> {
        const result = await db
            .delete(insurances)
            .where(eq(insurances.id, id))
            .returning();

        return result.length > 0;
    }
}

function mapToInsurance(data: any): Insurance {
    return {
        id: data.id,
        simulationId: data.simulationId,
        type: data.type,
        coverageAmount: Number(data.coverageAmount),
        monthlyCost: Number(data.monthlyCost),
        startDate: data.startDate,
        endDate: data.endDate,

        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
}
