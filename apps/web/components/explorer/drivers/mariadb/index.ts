import type { ExplorerDriverModule } from '../types';
import { noopSchemaDriver } from '../shared';
import { mariadbTableDriver } from './table';

export const mariadbExplorerDriver: ExplorerDriverModule = {
    id: 'mariadb',
    views: {},
    table: mariadbTableDriver,
    schema: noopSchemaDriver,
};
