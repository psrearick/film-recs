import { describeAffinity } from '@/components/taste-profile/describe';
import type { PersonAffinity } from '@/components/taste-profile/types';
import { tmdbImage } from '@/components/title/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function PersonAffinityList({
    heading,
    people,
    onSelect,
}: {
    heading: string;
    people: PersonAffinity[];
    onSelect: (person: PersonAffinity) => void;
}) {
    if (people.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {heading}
            </h3>
            <ItemGroup>
                {people.map((person) => (
                    <Item key={person.tmdb_id} size="sm" asChild>
                        <button
                            type="button"
                            className="cursor-pointer text-left"
                            onClick={() => onSelect(person)}
                        >
                            <ItemMedia>
                                <Avatar className="size-10">
                                    <AvatarImage
                                        src={
                                            tmdbImage(
                                                person.profile_path,
                                                'w185',
                                            ) ?? undefined
                                        }
                                        alt=""
                                    />
                                    <AvatarFallback>
                                        {initials(person.label)}
                                    </AvatarFallback>
                                </Avatar>
                            </ItemMedia>
                            <ItemContent>
                                <ItemTitle>{person.label}</ItemTitle>
                                <ItemDescription>
                                    {describeAffinity(person)}
                                </ItemDescription>
                            </ItemContent>
                        </button>
                    </Item>
                ))}
            </ItemGroup>
        </div>
    );
}
