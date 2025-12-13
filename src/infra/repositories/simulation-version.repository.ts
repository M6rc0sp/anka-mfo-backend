import { db } from '../../db/connect';
import { simulationVersions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import {
    SimulationVersion,
    InvalidInputError,
} from '../../domain/entities';
import { ISimulationVersionRepository } from './interfaces';

export class SimulationVersionRepository implements ISimulationVersionRepository {
    async create(simulationId: string, data: { versionNumber?: number; snapshot: unknown }): Promise<SimulationVersion> {
        if (!simulationId) {
            throw new InvalidInputError('ID da simulação é obrigatório');
        }

        if (!data?.snapshot) {
            throw new InvalidInputError('Snapshot é obrigatório');
        }

        try {
            // Get the highest version number for this simulation
            const lastVersion = await db
                .select()
                .from(simulationVersions)
                .where(eq(simulationVersions.simulationId, simulationId))
                .orderBy(simulationVersions.versionNumber)
                .then((results) => results[results.length - 1]);

            const nextVersionNumber = data.versionNumber ?? ((lastVersion?.versionNumber ?? 0) + 1);

            const insertData = {
                simulationId,
                versionNumber: nextVersionNumber,
                snapshot: data.snapshot,
            };

            const result = await db.insert(simulationVersions).values(insertData as any).returning();

            return mapToSimulationVersion(result[0]);
        } catch (error: any) {
            if (error.code === '23503') {
                throw new InvalidInputError('Simulação não encontrada');
            }
            throw error;
        }
    }

    async findById(id: string): Promise<SimulationVersion | null> {
        const result = await db
            .select()
            .from(simulationVersions)
            .where(eq(simulationVersions.id, id));

        if (result.length === 0) {
            return null;
        }

        return mapToSimulationVersion(result[0]);
    }

    async findBySimulationId(simulationId: string): Promise<SimulationVersion[]> {
        const results = await db
            .select()
            .from(simulationVersions)
            .where(eq(simulationVersions.simulationId, simulationId))
            .orderBy(simulationVersions.versionNumber);

        return results.map(mapToSimulationVersion);
    }

    async findAll(): Promise<SimulationVersion[]> {
        const results = await db
            .select()
            .from(simulationVersions)
            .orderBy(simulationVersions.versionNumber);

        return results.map(mapToSimulationVersion);
    }
}

function mapToSimulationVersion(data: any): SimulationVersion {
    return {
        id: data.id,
        simulationId: data.simulationId,
        versionNumber: data.versionNumber,
        snapshot: data.snapshot,
        createdAt: data.createdAt,
    };
}
