import type { ConnectionType } from '../base/types';
import type { ConnectionDriverCtor } from './types';
import { ClickhouseDatasource } from '../drivers/clickhouse/ClickhouseDatasource';

const registry = new Map<ConnectionType, ConnectionDriverCtor>();

registry.set('clickhouse', ClickhouseDatasource);

export function registerDriver(type: ConnectionType, ctor: ConnectionDriverCtor) {
    registry.set(type, ctor);
}

export function getDriver(type: ConnectionType): ConnectionDriverCtor | undefined {
    return registry.get(type);
}
