import Fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { env } from './config/env';
import { createRepositories } from './infra/repositories/factory';
import { errorHandler } from './http/middleware/error-handler';
import { registerClientRoutes } from './http/routes/clients';

export async function createApp(): Promise<FastifyInstance> {
    const fastify = Fastify({
        logger: {
            level: env.NODE_ENV === 'production' ? 'info' : 'debug',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            },
        },
    });

    // Register plugins (tolerate version mismatches at runtime)
    try {
        await fastify.register(fastifyHelmet, {
            contentSecurityPolicy: false,
        });
    } catch (e: any) {
        fastify.log?.warn?.('@fastify/helmet registration skipped: ' + (e?.message || e));
    }

    try {
        await fastify.register(fastifyCors, {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        });
    } catch (e: any) {
        fastify.log?.warn?.('@fastify/cors registration skipped: ' + (e?.message || e));
    }

    try {
        await fastify.register(fastifySwagger, {
            openapi: {
                openapi: '3.0.0',
                info: {
                    title: 'Anka MFO API',
                    description: 'Multi Family Office Platform API',
                    version: '1.0.0',
                },
                servers: [
                    {
                        url: `http://localhost:${env.API_PORT}`,
                        description: 'Development server',
                    },
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT',
                        },
                    },
                },
            },
        });
    } catch (e: any) {
        fastify.log?.warn?.('@fastify/swagger registration skipped: ' + (e?.message || e));
    }

    try {
        await fastify.register(fastifySwaggerUi, {
            routePrefix: '/docs',
        });
    } catch (e: any) {
        fastify.log?.warn?.('@fastify/swagger-ui registration skipped: ' + (e?.message || e));
    }

    // Create repositories
    const repositories = createRepositories();

    // Register error handler
    fastify.setErrorHandler(errorHandler);

    // Register routes
    await registerClientRoutes(fastify, repositories);

    // Health check endpoint
    fastify.get('/health', async () => {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    });

    // Ready hook
    fastify.ready((err: Error | null) => {
        if (err) throw err;
        console.log('✓ Fastify application ready');
    });

    return fastify;
}

export async function startApp(fastify: FastifyInstance): Promise<void> {
    try {
        await fastify.listen(
            {
                host: '0.0.0.0',
                port: env.API_PORT,
            },
            (err, address) => {
                if (err) {
                    fastify.log.error(err);
                    process.exit(1);
                }
                console.log(`✓ Server listening at ${address}`);
            }
        );
    } catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
}

export async function closeApp(fastify: FastifyInstance): Promise<void> {
    try {
        await fastify.close();
        console.log('✓ Fastify application closed gracefully');
    } catch (error) {
        console.error('Error closing Fastify:', error);
        process.exit(1);
    }
}
