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
                <div className="flex w-full flex-col opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <Navbar hideLink={hideNavbarLink} />
                    {children}
                </div>
            </div>
        </>
    );
}
