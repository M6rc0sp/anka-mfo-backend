import { db } from '../../db/connect';
import { simulations } from '../../db/schema';
import { eq } from 'drizzle-orm';
import {
    Simulation,
    CreateSimulationInput,
    NotFoundError,
    InvalidInputError,
    ConflictError,
} from '../../domain/entities';
import { ISimulationRepository } from './interfaces';

export class SimulationRepository implements ISimulationRepository {
    async create(input: CreateSimulationInput): Promise<Simulation> {
        if (!input.clientId) {
            throw new InvalidInputError('Cliente ID é obrigatório');
        }

        if (!input.name || input.name.trim() === '') {
            throw new InvalidInputError('Nome da simulação é obrigatório');
        }

        try {
            const insertData: Record<string, any> = {
                clientId: input.clientId,
                name: input.name.trim(),
                initialCapital: input.initialCapital ?? 0,
            };

            if (input.description !== undefined) insertData.description = input.description;
            if (input.monthlyContribution !== undefined) insertData.monthlyContribution = input.monthlyContribution;
            if (input.inflationRate !== undefined) insertData.inflationRate = input.inflationRate;
            if (input.yearsProjection !== undefined) insertData.yearsProjection = input.yearsProjection;

            const result = await db.insert(simulations).values(insertData as any).returning();

            return mapToSimulation(result[0]);
        } catch (error: any) {
            if (error.code === '23505') {
                throw new ConflictError('Simulação duplicada');
            }
            throw error;
        }
    }

    async findById(id: string): Promise<Simulation | null> {
        const result = await db
            .select()
            .from(simulations)
            .where(eq(simulations.id, id));

        if (result.length === 0) {
            return null;
        }

        return mapToSimulation(result[0]);
    }

    async findByClientId(clientId: string): Promise<Simulation[]> {
        const results = await db
            .select()
            .from(simulations)
            .where(eq(simulations.clientId, clientId));

        return results.map(mapToSimulation);
    }

    async findAll(): Promise<Simulation[]> {
        const results = await db.select().from(simulations);
        return results.map(mapToSimulation);
    }

    async update(id: string, input: Partial<CreateSimulationInput>): Promise<Simulation> {
        const existing = await this.findById(id);

        if (!existing) {
            throw new NotFoundError('Simulation', id);
        }

        const updateData: Record<string, any> = {
            updatedAt: new Date(),
        };

        if (input.name !== undefined) {
            if (input.name.trim() === '') {
                throw new InvalidInputError('Nome não pode ser vazio');
            }
            updateData.name = input.name.trim();
        }

        if (input.description !== undefined) {
            updateData.description = input.description;
        }

        if (input.initialCapital !== undefined) {
            if (input.initialCapital < 0) {
                throw new InvalidInputError('Capital inicial não pode ser negativo');
            }
            updateData.initialCapital = input.initialCapital;
        }

        if (input.monthlyContribution !== undefined) {
            if (input.monthlyContribution < 0) {
                throw new InvalidInputError('Contribuição mensal não pode ser negativa');
            }
            updateData.monthlyContribution = input.monthlyContribution;
        }

        if (input.inflationRate !== undefined) {
            updateData.inflationRate = input.inflationRate;
        }

        if (input.yearsProjection !== undefined) {
            updateData.yearsProjection = input.yearsProjection;
        }

        const result = await db
            .update(simulations)
            .set(updateData)
            .where(eq(simulations.id, id))
            .returning();

        return mapToSimulation(result[0]);
    }

    async delete(id: string): Promise<boolean> {
        const result = await db
            .delete(simulations)
            .where(eq(simulations.id, id))
            .returning();

        return result.length > 0;
    }
}

function mapToSimulation(data: any): Simulation {
    return {
        id: data.id,
        clientId: data.clientId,
        name: data.name,
        description: data.description,
        status: data.status,
        initialCapital: Number(data.initialCapital),
        monthlyContribution: Number(data.monthlyContribution),
        inflationRate: Number(data.inflationRate),
        yearsProjection: data.yearsProjection,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
}
