import { UserRound } from 'lucide-react';
import { tmdbImage } from '@/components/title/types';

export default function PersonAvatar({
    path,
    name,
}: {
    path: string | null;
    name: string;
}) {
    const src = tmdbImage(path, 'w185');

    if (!src) {
        return (
            <div className="flex aspect-2/3 w-full items-center justify-center bg-gray-800">
                <UserRound className="text-gray-500" size={32} />
            </div>
        );
    }

    return (
        <img className="aspect-2/3 w-full object-cover" src={src} alt={name} />
    );
}
