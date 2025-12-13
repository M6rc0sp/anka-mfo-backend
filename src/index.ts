import { connectDatabase, disconnectDatabase } from './db/connect';
import { createApp, startApp, closeApp } from './app';

async function main() {
    try {
        // Connect to database
        console.log('🔌 Connecting to database...');
        await connectDatabase();
        console.log('✓ Database connected');

        // Create Fastify application
        console.log('🚀 Creating Fastify application...');
        const app = await createApp();
        console.log('✓ Fastify application created');

        // Start server
        await startApp(app);

        // Graceful shutdown
        const signals = ['SIGTERM', 'SIGINT'];
        signals.forEach((signal) => {
            process.on(signal, async () => {
                console.log(`\n📍 Received ${signal} signal, shutting down gracefully...`);
                await closeApp(app);
                await disconnectDatabase();
                console.log('✓ All resources cleaned up');
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('❌ Fatal error:', error);
        await disconnectDatabase();
        process.exit(1);
    }
}

main();
