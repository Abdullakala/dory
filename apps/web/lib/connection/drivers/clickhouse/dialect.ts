import type { ConnectionParameterDialect } from '@/lib/connection/registry/types';

export const ClickhouseDialect: ConnectionParameterDialect = {
    id: 'clickhouse',
    parameterStyle: 'named',
};
