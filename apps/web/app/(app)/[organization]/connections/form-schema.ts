import { z } from 'zod';
import { getConnectionDriver } from './components/forms/connection/drivers';

const requiredPort = z.preprocess(
    value => {
        if (value === '' || value === null || typeof value === 'undefined') return undefined;
        if (typeof value === 'string') return Number(value);
        return value;
    },
    z.number().int().min(1, 'Please provide a port number').max(65535, 'Port must be between 1 and 65535'),
);

function isAbsolutePath(value: string) {
    return /^(\/|[a-zA-Z]:[\\/])/.test(value);
}

export const ConnectionDialogFormSchema = z.object({
    connection: z.object({
        type: z.string().min(1, 'Please select a connection type'),
        name: z.string().min(1, 'Please provide a connection name'),
        description: z.string().optional().nullable(),
        host: z.string().optional().nullable(),
        port: requiredPort.optional().nullable(),
        httpPort: requiredPort.optional().nullable(),
        ssl: z.boolean().default(false),
        database: z.string().optional().nullable(),
        path: z.string().optional().nullable(),
        environment: z.string().optional(),
        tags: z.string().optional(),
    }),
    identity: z.object({
        name: z.string().optional(),
        username: z.string().optional().nullable(),
        role: z.string().optional().nullable(),
        password: z.string().optional().nullable(),
        isDefault: z.boolean().optional(),
    }),
    ssh: z.object({
        enabled: z.boolean().optional(),
        host: z.string().optional().nullable(),
        port: z.number().optional().nullable(),
        username: z.string().optional().nullable(),
        authMethod: z.string().optional().nullable(),
        password: z.string().optional().nullable(),
        privateKey: z.string().optional().nullable(),
        passphrase: z.string().optional().nullable(),
    }),
}).superRefine((value, ctx) => {
    const driver = getConnectionDriver(value.connection.type);
    driver.validate(value.connection, ctx);

    if (value.connection.type === 'sqlite') {
        const normalizedPath = value.connection.path?.trim() ?? '';
        if (!normalizedPath) {
            ctx.addIssue({
                code: 'custom',
                path: ['connection', 'path'],
                message: 'Please provide a SQLite file path',
            });
        } else if (!isAbsolutePath(normalizedPath)) {
            ctx.addIssue({
                code: 'custom',
                path: ['connection', 'path'],
                message: 'SQLite path must be absolute',
            });
        }
        return;
    }

    if (!value.connection.host?.trim()) {
        ctx.addIssue({
            code: 'custom',
            path: ['connection', 'host'],
            message: 'Please provide a host',
        });
    }

    if (typeof value.connection.port !== 'number' || !Number.isFinite(value.connection.port)) {
        ctx.addIssue({
            code: 'custom',
            path: ['connection', 'port'],
            message: 'Please provide a port number',
        });
    }

    if (!value.identity.username?.trim()) {
        ctx.addIssue({
            code: 'custom',
            path: ['identity', 'username'],
            message: 'Please provide a username',
        });
    }
});
