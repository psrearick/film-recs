import { router, useHttp } from '@inertiajs/react';
import { Command as CommandPrimitive } from 'cmdk';
import debounce from 'lodash.debounce';
import { Search, Loader2 } from 'lucide-react';
import { cn } from 'cn';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
} from '@/components/ui/popover';
import { search } from '@/routes';
import { useEffect, useMemo, useRef, useState } from 'react';

interface SearchResult {
    id: number;
    type: 'movie' | 'tv' | 'person';
    label: string;
    posterPath: string | null;
    url: string;
}

interface SearchResponse {
    results: SearchResult[];
}

export default function SearchBar() {
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const anchorRef = useRef<HTMLDivElement>(null);

    const { data, setData, get, cancel, processing } = useHttp<
        { search: string },
        SearchResponse
    >({
        search: '',
    });

    const debouncedSearch = useMemo(
        () =>
            debounce(() => {
                cancel();
                get(search.url(), {
                    onSuccess: (response) => {
                        setResults(response.results);
                        setOpen(response.results.length > 0);
                    },
                    onError: () => {
                        setResults([]);
                        setOpen(false);
                    },
                    onHttpException: () => {
                        setResults([]);
                        setOpen(false);
                    },
                    onNetworkError: () => {
                        setResults([]);
                        setOpen(false);
                    },
                }).catch(() => {
                    // Cancellation and handled errors above already
                    // updated state; nothing left to do here.
                });
            }, 300),
        [get, cancel],
    );

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
            cancel();
        };
    }, [debouncedSearch, cancel]);

    const handleSearchChange = (value: string) => {
        setData('search', value);

        if (!value.trim()) {
            debouncedSearch.cancel();
            cancel();
            setResults([]);
            setOpen(false);
        } else {
            debouncedSearch();
        }
    };

    const handleSelect = (result: SearchResult) => {
        setOpen(false);
        router.visit(result.url);
    };

    return (
        <div className="mx-auto w-full max-w-lg">
            <Command
                shouldFilter={false}
                className="overflow-visible bg-transparent p-0"
            >
                <Popover
                    open={open && data.search.length > 0}
                    onOpenChange={setOpen}
                >
                    <PopoverAnchor asChild>
                        <div ref={anchorRef} className="relative w-full">
                            {processing ? (
                                <Loader2 className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                            )}
                            <CommandPrimitive.Input
                                value={data.search}
                                onValueChange={handleSearchChange}
                                placeholder="Search for a movie, tv show, or person..."
                                onFocus={() => {
                                    if (results.length > 0) setOpen(true);
                                }}
                                className={cn(
                                    'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 pl-9 text-base transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                                )}
                            />
                        </div>
                    </PopoverAnchor>

                    <PopoverContent
                        className="w-(--radix-popover-trigger-width) p-0"
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onInteractOutside={(e) => {
                            if (anchorRef.current?.contains(e.target as Node)) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <CommandList>
                            {results.length === 0 && !processing && (
                                <CommandEmpty>No results found.</CommandEmpty>
                            )}
                            {results.length > 0 && (
                                <CommandGroup heading="Results">
                                    {results.map((result) => (
                                        <CommandItem
                                            key={`${result.type}-${result.id}`}
                                            value={`${result.type}-${result.id}`}
                                            onSelect={() =>
                                                handleSelect(result)
                                            }
                                        >
                                            {result.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </PopoverContent>
                </Popover>
            </Command>
        </div>
    );
}
