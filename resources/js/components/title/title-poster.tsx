import { tmdbImage } from '@/components/title/types';
import { Clapperboard, LucideIcon } from 'lucide-react';

export default function TitlePoster({
    path,
    name,
    icon: Icon = Clapperboard,
    iconSize = 32,
    imageSize = 'w185',
}: {
    path: string | null;
    name: string;
    icon?: LucideIcon;
    iconSize?: number;
    imageSize?: string;
}) {
    const src = tmdbImage(path, imageSize);

    if (!src) {
        return (
            <div className="flex aspect-2/3 w-full items-center justify-center bg-gray-800">
                <Icon className="text-gray-500" size={iconSize} />
            </div>
        );
    }

    return (
        <img className="aspect-2/3 w-full object-cover" src={src} alt={name} />
    );
}
