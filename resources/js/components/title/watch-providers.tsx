import JustWatchAttribution from '@/components/title/justwatch-attribution';
import {
    ACCESS_TYPE_LABELS,
    tmdbImage,
    WatchProvider,
} from '@/components/title/types';

export default function WatchProviders({
    providers,
}: {
    providers: WatchProvider[];
}) {
    const providersByAccessType = providers.reduce<
        Record<string, WatchProvider[]>
    >((groups, provider) => {
        const accessType = provider.pivot.access_type;

        groups[accessType] = [...(groups[accessType] ?? []), provider];

        return groups;
    }, {});

    if (Object.keys(providersByAccessType).length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-4 bg-gray-900/60 px-6 py-6 md:px-10 lg:px-16">
            <div className="flex flex-col gap-6 md:flex-row md:gap-20">
                {Object.entries(providersByAccessType).map(
                    ([accessType, accessTypeProviders]) => (
                        <div key={accessType} className="mb-4 last:mb-0">
                            <h2 className="mb-2 text-lg">
                                {ACCESS_TYPE_LABELS[
                                    accessType as WatchProvider['pivot']['access_type']
                                ] ?? accessType}
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {accessTypeProviders.map((provider) => (
                                    <img
                                        key={provider.id}
                                        className="h-12 w-12 rounded-lg"
                                        src={
                                            tmdbImage(
                                                provider.logo_path,
                                                'w92',
                                            ) ?? undefined
                                        }
                                        alt={provider.name}
                                        title={provider.name}
                                    />
                                ))}
                            </div>
                        </div>
                    ),
                )}
            </div>
            <JustWatchAttribution />
        </div>
    );
}
