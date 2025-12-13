import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export async function errorHandler(error: Error & { statusCode?: number; code?: string }, _request: FastifyRequest, reply: FastifyReply) {
    // Fastify validation error
    if (error.statusCode === 400 && error.code === 'FST_ERR_VALIDATION') {
        return reply.status(400).send({
            success: false,
            error: 'Validation Error',
            details: error,
        });
    }

    if (error instanceof ZodError) {
        return reply.status(400).send({
            success: false,
            error: 'Validation Error',
            details: error.errors,
        });
    }

    if (error.name === 'NotFoundError') {
        return reply.status(404).send({
            success: false,
            error: error.message,
        });
    }

    if (error.name === 'ConflictError') {
        return reply.status(409).send({
            success: false,
            error: error.message,
        });
    }

    if (error.name === 'InvalidInputError') {
        return reply.status(400).send({
            success: false,
            error: error.message,
        });
    }

    // Default error
    console.error('Unhandled error:', error);
    return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
    });
}

