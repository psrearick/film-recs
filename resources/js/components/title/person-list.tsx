import PersonAvatar from '@/components/title/person-avatar';
import { Person } from '@/components/title/types';
import { Card, CardContent } from '@/components/ui/card';
import { person as personRoute } from '@/routes';
import { Link } from '@inertiajs/react';

export default function PersonList({
    title,
    people,
}: {
    title: string;
    people: (Person & { role?: string })[];
}) {
    if (people.length === 0) {
        return null;
    }

    return (
        <div className="px-6 py-6 md:px-10 lg:px-16">
            <h2 className="mb-4 text-lg">{title}</h2>
            <div className="flex flex-wrap gap-4">
                {people.map((person, index) => (
                    <Card
                        key={`${person.id}-${person.role ?? index}`}
                        size="sm"
                        className="w-32"
                    >
                        <Link href={personRoute(person.tmdb_id)}>
                            <PersonAvatar
                                path={person.profile_path}
                                name={person.name}
                            />
                        </Link>
                        <CardContent>
                            <p className="text-sm">{person.name}</p>
                            {person.role && (
                                <p className="text-xs text-gray-400">
                                    {person.role}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
