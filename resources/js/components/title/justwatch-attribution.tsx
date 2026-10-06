import { cn } from '@/lib/utils';

export default function JustWatchAttribution({
    className,
}: {
    className?: string;
}) {
    return (
        <p
            className={cn(
                'text-muted-foreground flex items-center gap-2 text-xs',
                className,
            )}
        >
            Watch provider data powered by
            <a
                href="https://www.justwatch.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
            >
                <img
                    className="h-3"
                    src="/justwatch-logo.svg"
                    alt="JustWatch"
                />
            </a>
        </p>
    );
}
