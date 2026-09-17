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
                <div className="flex h-10 w-full items-center border-t">
                    <p className="text-muted-foreground mx-auto text-sm">
                        &copy; {new Date().getFullYear()} FilmRecs. All rights
                        reserved.
                    </p>
                </div>
            </div>
        </>
    );
}
