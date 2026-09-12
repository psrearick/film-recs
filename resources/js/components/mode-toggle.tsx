import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';

const nextTheme = {
    light: 'dark',
    dark: 'system',
    system: 'light',
} as const;

const icon = {
    light: Sun,
    dark: Moon,
    system: Monitor,
} as const;

export function ModeToggle() {
    const { theme, setTheme } = useTheme();
    const Icon = icon[theme];

    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label={`Switch theme (currently ${theme})`}
            onClick={() => setTheme(nextTheme[theme])}
        >
            <Icon />
        </Button>
    );
}
