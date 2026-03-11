import { UseFormReturn } from 'react-hook-form';
import { CircleHelp } from 'lucide-react';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/registry/new-york-v4/ui/form';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york-v4/ui/select';
import { Switch } from '@/registry/new-york-v4/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/new-york-v4/ui/tooltip';
import { useTranslations } from 'next-intl';
import RequiredMark from '../../require-mark';

function FieldHelp({ text }: { text: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Show field help"
                >
                    <CircleHelp className="h-4 w-4" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" sideOffset={6} className="max-w-64 text-left leading-relaxed">
                {text}
            </TooltipContent>
        </Tooltip>
    );
}

export default function ConnectionForm(props: { form: UseFormReturn<any> }) {
    const { form } = props;
    const { control } = form;
    const t = useTranslations('Connections.ConnectionContent');

    return (
        <div className="space-y-4">
            
            <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] items-start">
                
                <FormField
                    control={control}
                    name="connection.name"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel>
                                {t('Connection Name')}
                                <RequiredMark />
                            </FormLabel>
                            <FormControl>
                                <Input placeholder={t('Connection Name Placeholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                
                <FormField
                    control={control}
                    name="connection.type"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel>
                                {t('Type')}
                                <RequiredMark />
                            </FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl className="w-full">
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Select Database Type')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="clickhouse">ClickHouse</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            
            <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] items-start">
                
                <FormField
                    control={control}
                    name="connection.host"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-1.5">
                                <span>
                                    {t('Host')}
                                    <RequiredMark />
                                </span>
                                <FieldHelp text="Use your ClickHouse server hostname or IP address." />
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="xxxx.us-east-1.aws.clickhouse.cloud" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                
                <FormField
                    control={control}
                    name="connection.httpPort"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-1.5">
                                <span>
                                    Port
                                    <RequiredMark />
                                </span>
                                <FieldHelp text="ClickHouse Cloud usually uses 8443 for HTTPS." />
                            </FormLabel>
                            <FormControl>
                                <Input
                                    inputMode="numeric"
                                    placeholder="8123"
                                    value={field.value?.toString() ?? ''}
                                    onChange={e => {
                                        const raw = e.target.value;
                                        if (raw === '') {
                                            field.onChange('');
                                            return;
                                        }
                                        const next = Number(raw);
                                        if (!Number.isNaN(next)) {
                                            field.onChange(next);
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={control}
                name="connection.ssl"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                        <div>
                            <div className="flex items-center gap-1.5">
                                <FormLabel className="text-sm font-medium">SSL</FormLabel>
                                <FieldHelp text="Turn this on for ClickHouse Cloud or any HTTPS endpoint." />
                            </div>
                        </div>
                        <FormControl>
                            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
