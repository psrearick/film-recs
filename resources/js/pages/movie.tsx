import { Clapperboard } from 'lucide-react';
import TitleDetail from '@/components/title/title-detail';
import { Title } from '@/components/title/types';

export default function Movie({ movie }: { movie: Title }) {
    return <TitleDetail title={movie} posterIcon={Clapperboard} />;
}
