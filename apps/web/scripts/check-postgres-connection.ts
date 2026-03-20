import 'dotenv/config';
import { Client } from 'pg';

async function main() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL is missing');
    }

    console.log(`[DB Check] Connecting with DATABASE_URL: ${connectionString}`);

    const client = new Client({
        connectionString,
        connectionTimeoutMillis: 10000,
    });

    try {
        await client.connect();
        const result = await client.query(
            'select current_database() as database, current_user as user_name, now() as server_time',
        );
        console.log('[DB Check] Connection succeeded');
        console.log(result.rows[0]);
    } finally {
        await client.end().catch(() => undefined);
    }
}

main().catch(error => {
    console.error('[DB Check] Connection failed');
    console.error(error);
    process.exit(1);
});
