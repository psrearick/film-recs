import { Link, setLayoutProps, usePage } from '@inertiajs/react';
import { login, register } from '@/routes';
import { Button } from '@/components/ui/button';
import TitleRow from '@/components/title/title-row';
import { PopularTitle } from '@/components/title/types';

export default function Welcome({
    movies,
    series,
}: {
    movies: PopularTitle[];
    series: PopularTitle[];
}) {
    setLayoutProps({ title: 'Welcome' });
    const { auth } = usePage().props;

    return (
        <main className="flex h-full w-full flex-col">
            <div
                className="flex w-full flex-col items-center bg-amber-800/90 bg-cover bg-center py-32 bg-blend-multiply"
                style={{ backgroundImage: "url('./film-strips.jpeg')" }}
            >
                <h1 className="font-heading text-center text-4xl">Hi there!</h1>
                <h2 className="font-heading text-center text-2xl text-white">
                    Let's discover your next watch.
                </h2>
                {!auth.user ? (
                    <div className="flex gap-6 py-6">
                        <Button asChild size="lg" variant="default">
                            <Link href={login()}>Sign in</Link>
                        </Button>
                        <Button asChild size="lg" variant="default">
                            <Link href={register()}>Register</Link>
                        </Button>
                    </div>
                ) : null}
            </div>
            <TitleRow title="Popular Movies" titles={movies} type="movie" />
            <TitleRow title="Popular TV Shows" titles={series} type="series" />
        </main>
    );
}
