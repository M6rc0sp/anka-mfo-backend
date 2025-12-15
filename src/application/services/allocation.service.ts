import { Allocation, CreateAllocationInput, NotFoundError } from '../../domain/entities';
import { IAllocationRepository } from '../../infra/repositories/interfaces';

export class AllocationService {
    constructor(private readonly allocationRepository: IAllocationRepository) { }

    async findById(id: string): Promise<Allocation> {
        const allocation = await this.allocationRepository.findById(id);
        if (!allocation) {
            throw new NotFoundError('Allocation', id);
        }
        return allocation;
    }

    async findBySimulationId(simulationId: string): Promise<Allocation[]> {
        return this.allocationRepository.findBySimulationId(simulationId);
    }

    async create(input: CreateAllocationInput): Promise<Allocation> {
        return this.allocationRepository.create(input);
    }

    async update(id: string, data: Partial<Allocation>): Promise<Allocation> {
        await this.findById(id);
        return this.allocationRepository.update(id, data);
    }

    async delete(id: string): Promise<boolean> {
        await this.findById(id);
        return this.allocationRepository.delete(id);
    }
}
