import { Tv } from 'lucide-react';
import { setLayoutProps } from '@inertiajs/react';
import TitleDetail from '@/components/title/title-detail';
import { Title } from '@/components/title/types';

export default function Series({ series }: { series: Title }) {
    setLayoutProps({ title: series.name });

    return <TitleDetail title={series} posterIcon={Tv} />;
}
