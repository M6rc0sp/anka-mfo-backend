import { eq } from 'drizzle-orm';
import { db } from '../../db/connect';
import {
    Client,
    CreateClientInput,
    NotFoundError,
    ConflictError,
    InvalidInputError,
} from '../../domain/entities';
import { IClientRepository } from './interfaces';
import { clients } from '../../db/schema';

export class ClientRepository implements IClientRepository {
    async create(input: CreateClientInput): Promise<Client> {
        // Validar email obrigatório
        if (!input.email) {
            throw new InvalidInputError('Email is required');
        }

        // Verificar se email já existe
        const existing = await db
            .select()
            .from(clients)
            .where(eq(clients.email, input.email))
            .limit(1);

        if (existing.length > 0) {
            throw new ConflictError(`Client with email ${input.email} already exists`);
        }

        const dbValues: any = {
            name: input.name,
            email: input.email,
            cpf: input.cpf,
            phone: input.phone,
            birthdate: input.birthdate ? input.birthdate.toISOString() : undefined,
        };

        const result = await db
            .insert(clients)
            .values(dbValues)
            .returning();

        if (!result || result.length === 0) {
            throw new Error('Failed to create client - no result returned');
        }

        return this.mapToClient(result[0]);
    }

    async findById(id: string): Promise<Client | null> {
        const [client] = await db
            .select()
            .from(clients)
            .where(eq(clients.id, id))
            .limit(1);

        return client ? this.mapToClient(client) : null;
    }

    async findByEmail(email: string): Promise<Client | null> {
        const [client] = await db
            .select()
            .from(clients)
            .where(eq(clients.email, email))
            .limit(1);

        return client ? this.mapToClient(client) : null;
    }

    async findAll(): Promise<Client[]> {
        const allClients = await db.select().from(clients);
        return allClients.map((c: any) => this.mapToClient(c));
    }

    async update(id: string, data: Partial<Client>): Promise<Client> {
        const existing = await this.findById(id);
        if (!existing) {
            throw new NotFoundError('Client', id);
        }

        // Se está atualizando email, verificar se não existe outro com esse email
        if (data.email && data.email !== existing.email) {
            const conflict = await this.findByEmail(data.email);
            if (conflict) {
                throw new ConflictError(`Client with email ${data.email} already exists`);
            }
        }

        const setObj: any = { ...data };

        if (data.birthdate instanceof Date) {
            setObj.birthdate = data.birthdate.toISOString();
        }

        setObj.updatedAt = new Date().toISOString();

        const [updated] = await db
            .update(clients)
            .set(setObj)
            .where(eq(clients.id, id))
            .returning();

        return this.mapToClient(updated);
    }

    async delete(id: string): Promise<boolean> {
        const result = await db
            .delete(clients)
            .where(eq(clients.id, id))
            .returning();

        return result.length > 0;
    }

    private mapToClient(raw: any): Client {
        return {
            id: raw.id,
            name: raw.name,
            email: raw.email,
            cpf: raw.cpf,
            phone: raw.phone,
            birthdate: raw.birthdate ? new Date(raw.birthdate) : undefined,
            status: raw.status,
            createdAt: new Date(raw.createdAt),
            updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(raw.createdAt),
        };
    }
}
