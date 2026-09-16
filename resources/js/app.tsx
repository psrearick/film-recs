import { createInertiaApp } from '@inertiajs/react';
import { ThemeProvider } from '@/components/theme-provider';
import Layout from '@/Layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: () => Layout,
    withApp(app) {
        return <ThemeProvider storageKey="vite-ui-theme">{app}</ThemeProvider>;
    },
    progress: {
        color: '#4B5563',
    },
});
