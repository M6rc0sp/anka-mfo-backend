import { FastifyReply, FastifyRequest } from 'fastify';
import { LifeStatus } from '../../domain/services/projection-engine';
import { ProjectionService } from '../../application/services/projection.service';
import { ISimulationRepository } from '../../infra/repositories/interfaces';

type ProjectionQuery = {
    startDate?: string;
    endDate?: string;
    interestRate?: string | number;
    inflationRate?: string | number;
    lifeStatus?: string;
    lifeStatusChangeDate?: string;
};

export class ProjectionController {
    constructor(
        private readonly projectionService: ProjectionService,
        private readonly simulationRepository: ISimulationRepository
    ) { }

    async execute(
        request: FastifyRequest<{ Params: { id: string }; Querystring: ProjectionQuery }>,
        reply: FastifyReply
    ) {
        const { id } = request.params;
        const simulation = await this.simulationRepository.findById(id);

        if (!simulation) {
            return this.sendError(reply, 404, 'Simulação não encontrada');
        }

        const startDate = request.query.startDate ? this.parseDate(request.query.startDate) : undefined;
        if (request.query.startDate && !startDate) {
            return this.sendError(reply, 400, 'Data inicial inválida');
        }

        const parsedEndDate = request.query.endDate ? this.parseDate(request.query.endDate) : undefined;
        if (request.query.endDate && !parsedEndDate) {
            return this.sendError(reply, 400, 'Data final inválida');
        }

        const baseStart = startDate ?? new Date();
        const computedEndDate = parsedEndDate ?? this.buildDefaultEndDate(baseStart, simulation.yearsProjection);

        if (computedEndDate <= baseStart) {
            return this.sendError(reply, 400, 'Data final precisa ser posterior à inicial');
        }

        const interestRate = this.parseNumber(request.query.interestRate);
        if (request.query.interestRate !== undefined && interestRate === undefined) {
            return this.sendError(reply, 400, 'Taxa de juros inválida');
        }

        const inflationRate = this.parseNumber(request.query.inflationRate);
        if (request.query.inflationRate !== undefined && inflationRate === undefined) {
            return this.sendError(reply, 400, 'Taxa de inflação inválida');
        }

        const lifeStatus = this.parseLifeStatus(request.query.lifeStatus);
        if (request.query.lifeStatus && lifeStatus === undefined) {
            return this.sendError(reply, 400, 'Status de vida inválido');
        }

        const lifeStatusChangeDate = request.query.lifeStatusChangeDate
            ? this.parseDate(request.query.lifeStatusChangeDate)
            : undefined;
        if (request.query.lifeStatusChangeDate && !lifeStatusChangeDate) {
            return this.sendError(reply, 400, 'Data de mudança de status inválida');
        }

        const payload = {
            startDate: new Date(baseStart),
            endDate: new Date(computedEndDate),
            interestRate: interestRate ?? 0,
            inflationRate: inflationRate ?? Number(simulation.inflationRate ?? 0),
            lifeStatus,
            lifeStatusChangeDate,
        };

        const projection = await this.projectionService.calcular(id, payload);
        return reply.status(200).send(projection);
    }

    private parseDate(value?: string): Date | undefined {
        if (!value) return undefined;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }

    private parseNumber(value?: string | number): number | undefined {
        if (value === undefined || value === null) return undefined;
        const parsed = typeof value === 'number' ? value : Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    private parseLifeStatus(value?: string): LifeStatus | undefined {
        if (!value) return undefined;
        const normalized = value.toLowerCase();
        if (normalized === 'normal' || normalized === 'vivo') return 'normal';
        if (normalized === 'dead' || normalized === 'falecido') return 'dead';
        if (normalized === 'invalid' || normalized === 'incapacidade') return 'invalid';
        return undefined;
    }

    private buildDefaultEndDate(start: Date, years?: number): Date {
        const result = new Date(start);
        result.setFullYear(result.getFullYear() + (years ?? 20));
        return result;
    }

    private sendError(reply: FastifyReply, statusCode: number, message: string) {
        return reply.status(statusCode).send({
            success: false,
            error: message,
        });
    }
}
