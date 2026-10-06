import { router, setLayoutProps } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { tmdbImage, WatchProviderBase } from '@/components/title/types';
import { Checkbox } from '@/components/ui/checkbox';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { destroy, store } from '@/routes/watch-providers';

interface WatchProvidersProps {
    providers: WatchProviderBase[];
    userProviderIds: number[];
}

export default function WatchProviders({
    providers,
    userProviderIds,
}: WatchProvidersProps) {
    setLayoutProps({ title: 'Watch Providers' });

    const [query, setQuery] = useState('');

    const normalizedQuery = query.trim().toLowerCase();
    const filteredProviders = normalizedQuery
        ? providers.filter((provider) =>
              provider.name.toLowerCase().includes(normalizedQuery),
          )
        : providers;

    function toggleProvider(providerId: number, hasAccess: boolean) {
        const optimisticRouter = router.optimistic<WatchProvidersProps>(
            (props) => ({
                userProviderIds: hasAccess
                    ? [...props.userProviderIds, providerId]
                    : props.userProviderIds.filter((id) => id !== providerId),
            }),
        );

        if (hasAccess) {
            optimisticRouter.post(
                store.url(providerId),
                {},
                { preserveScroll: true },
            );
        } else {
            optimisticRouter.delete(destroy.url(providerId), {
                preserveScroll: true,
            });
        }
    }

    return (
        <main className="flex h-full w-full flex-col">
            <div className="mx-auto my-8 w-full max-w-7xl px-4">
                <h1 className="font-heading text-4xl">Your Watch Providers</h1>
            </div>
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-8">
                <InputGroup>
                    <InputGroupAddon>
                        <Search />
                    </InputGroupAddon>
                    <InputGroupInput
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search watch providers..."
                        aria-label="Search watch providers"
                    />
                </InputGroup>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">Access</TableHead>
                            <TableHead>Provider</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProviders.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={2}
                                    className="text-muted-foreground h-24 text-center"
                                >
                                    No watch providers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProviders.map((provider) => {
                                const checkboxId = `watch-provider-${provider.id}`;
                                const logo = tmdbImage(
                                    provider.logo_path,
                                    'w92',
                                );

                                return (
                                    <TableRow key={provider.id}>
                                        <TableCell>
                                            <Checkbox
                                                id={checkboxId}
                                                checked={userProviderIds.includes(
                                                    provider.id,
                                                )}
                                                onCheckedChange={(checked) =>
                                                    toggleProvider(
                                                        provider.id,
                                                        checked === true,
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <label
                                                htmlFor={checkboxId}
                                                className="flex cursor-pointer items-center gap-3"
                                            >
                                                {logo ? (
                                                    <img
                                                        className="h-10 w-10 rounded-lg"
                                                        src={logo}
                                                        alt=""
                                                    />
                                                ) : (
                                                    <div className="bg-muted h-10 w-10 rounded-lg" />
                                                )}
                                                <span>{provider.name}</span>
                                            </label>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </main>
    );
}
