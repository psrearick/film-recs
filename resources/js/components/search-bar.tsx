import { router, useHttp } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { search } from '@/routes';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

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

    const { data, setData, get, processing } = useHttp<
        { search: string },
        SearchResponse
    >({
        search: '',
    });

    const debouncedSearch = useMemo(
        () =>
            debounce(() => {
                void get(search.url(), {
                    onSuccess: (response) => {
                        setResults(response.results);
                        setOpen(response.results.length > 0);
                    },
                    onError: () => {
                        setResults([]);
                        setOpen(false);
                    },
                });
            }, 300),
        [get],
    );

    useEffect(() => {
        return () => debouncedSearch.cancel();
    }, [debouncedSearch]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('search', value);

        if (!value.trim()) {
            debouncedSearch.cancel();
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
            <Popover
                open={open && data.search.length > 0}
                onOpenChange={setOpen}
            >
                <PopoverTrigger asChild>
                    <div className="relative w-full">
                        {processing ? (
                            <Loader2 className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                        )}
                        <Input
                            type="search"
                            placeholder="Search for a movie, tv show, or person..."
                            value={data.search}
                            onChange={handleInputChange}
                            onFocus={() => {
                                if (results.length > 0) setOpen(true);
                            }}
                            className="w-full pl-9"
                        />
                    </div>
                </PopoverTrigger>

                <PopoverContent
                    className="w-(--radix-popover-trigger-width) p-0"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <Command shouldFilter={false}>
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
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
