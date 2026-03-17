
import DatabaseTabs from './components/database-tabs';

type ExplorerDatabasePageProps = {
    team: string;
    connectionId: string;
    database: string;
};

export default async function ExplorerDatabasePage({ params }: { params: Promise<ExplorerDatabasePageProps> }) {
    const { database } = await params;

    return (
        <DatabaseTabs database={database} />
    );
}
