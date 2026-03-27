import type { ConnectionParameterDialect } from '@/lib/connection/registry/types';

export const SqliteDialect: ConnectionParameterDialect = {
    id: 'sqlite',
    parameterStyle: 'positional',
};
