'use client';

import React from 'react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/registry/new-york-v4/ui/alert-dialog';
import { Button } from '@/registry/new-york-v4/ui/button';

type DeleteConfirmationDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    loadingLabel?: string;
    loading?: boolean;
    onConfirm: () => Promise<void> | void;
};

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel,
    loadingLabel,
    loading = false,
    onConfirm,
}: DeleteConfirmationDialogProps) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={nextOpen => {
                if (!loading) {
                    onOpenChange(nextOpen);
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
                            {cancelLabel}
                        </Button>
                    </AlertDialogCancel>
                    <Button variant="destructive" disabled={loading} onClick={() => void onConfirm()}>
                        {loading ? (loadingLabel ?? confirmLabel) : confirmLabel}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
