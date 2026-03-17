import { redirect } from 'next/navigation';

type ExplorerCatalogPageProps = {
    params: Promise<{
        team: string;
        connectionId: string;
    }>;
};

export default async function ExplorerCatalogPage({ params }: ExplorerCatalogPageProps) {
    const { team, connectionId } = await params;

    redirect(`/${encodeURIComponent(team)}/${encodeURIComponent(connectionId)}/explorer/catalog/default`);
}
