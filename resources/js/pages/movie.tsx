import { Clapperboard } from 'lucide-react';
import { setLayoutProps } from '@inertiajs/react';
import TitleDetail from '@/components/title/title-detail';
import { Title } from '@/components/title/types';

const Movie = ({ movie }: { movie: Title }) => {
    setLayoutProps({ title: movie.name });

    return <TitleDetail title={movie} posterIcon={Clapperboard} />;
};

export default Movie;
