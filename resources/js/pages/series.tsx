import { Tv } from 'lucide-react';
import TitleDetail from '@/components/title/title-detail';
import { Title } from '@/components/title/types';

export default function Series({ series }: { series: Title }) {
    return <TitleDetail title={series} posterIcon={Tv} />;
}
