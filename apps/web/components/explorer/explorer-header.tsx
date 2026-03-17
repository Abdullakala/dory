'use client';

import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/registry/new-york-v4/ui/breadcrumb';
import type { BreadcrumbItem as ExplorerBreadcrumbItem } from '@/lib/explorer/types';

type ExplorerHeaderProps = {
    breadcrumbs: ExplorerBreadcrumbItem[];
};

export function ExplorerHeader({ breadcrumbs }: ExplorerHeaderProps) {
    if (breadcrumbs.length === 0) {
        return null;
    }

    return (
        <div className="border-b px-6 py-3">
            <Breadcrumb>
                <BreadcrumbList>
                    {breadcrumbs.map((item, index) => (
                        <BreadcrumbItem key={`${item.label}-${item.href}`}>
                            <BreadcrumbLink asChild>
                                <Link href={item.href}>{item.label}</Link>
                            </BreadcrumbLink>
                            {index < breadcrumbs.length - 1 ? <BreadcrumbSeparator /> : null}
                        </BreadcrumbItem>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
}
