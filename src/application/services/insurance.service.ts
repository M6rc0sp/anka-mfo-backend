import { Insurance, CreateInsuranceInput, NotFoundError } from '../../domain/entities';
import { IInsuranceRepository } from '../../infra/repositories/interfaces';

export class InsuranceService {
    constructor(private readonly insuranceRepository: IInsuranceRepository) { }

    async findById(id: string): Promise<Insurance> {
        const insurance = await this.insuranceRepository.findById(id);
        if (!insurance) {
            throw new NotFoundError('Insurance', id);
        }
        return insurance;
    }

    async findBySimulationId(simulationId: string): Promise<Insurance[]> {
        return this.insuranceRepository.findBySimulationId(simulationId);
    }

    async create(input: CreateInsuranceInput): Promise<Insurance> {
        return this.insuranceRepository.create(input);
    }

    async update(id: string, data: Partial<Insurance>): Promise<Insurance> {
        await this.findById(id);
        return this.insuranceRepository.update(id, data);
    }

    async delete(id: string): Promise<boolean> {
        await this.findById(id);
        return this.insuranceRepository.delete(id);
    }
}
