import { ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import Navbar from '@/components/navbar';

export default function Layout({
    title = 'FilmRecs',
    hideNavbarLink,
    children,
}: {
    title?: string;
    hideNavbarLink?: 'login' | 'register';
    children: ReactNode;
}) {
    return (
        <>
            <Head title={title} />
            <div className="flex min-h-screen flex-col items-center lg:justify-center">
                <div className="flex w-full grow flex-col opacity-100 transition-opacity duration-750 starting:opacity-0">
                    <Navbar hideLink={hideNavbarLink} />
                    {children}
                </div>
                <footer className="text-muted-foreground flex w-full flex-col items-center gap-2 border-t px-4 py-3 text-center text-sm">
                    <div className="flex flex-col items-center gap-2 sm:flex-row">
                        <a
                            href="https://www.themoviedb.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0"
                        >
                            <img
                                className="h-3"
                                src="/tmdb-logo.svg"
                                alt="TMDB"
                            />
                        </a>
                        <p className="text-xs">
                            This product uses the TMDB API but is not endorsed
                            or certified by TMDB.
                        </p>
                    </div>
                    <p>
                        &copy; {new Date().getFullYear()} FilmRecs. All rights
                        reserved.
                    </p>
                </footer>
            </div>
        </>
    );
}
