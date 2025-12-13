import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3333),

    // Database
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
    DB_USER: z.string().default('postgres'),
    DB_PASSWORD: z.string().default('postgres'),
    DB_NAME: z.string().default('anka'),

    // JWT
    JWT_SECRET: z.string().default('your-secret-key-change-in-production'),
    JWT_EXPIRES_IN: z.string().default('24h'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(): Env {
    const env = process.env;

    try {
        return envSchema.parse(env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Invalid environment variables:');
            error.errors.forEach((err) => {
                console.error(`  ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
}

export const env = parseEnv();
