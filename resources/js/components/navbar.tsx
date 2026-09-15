import Logo from '@/components/logo';
import { Link } from '@inertiajs/react';
import { ModeToggle } from '@/components/mode-toggle';
import NavMenu from '@/components/nav-menu';
import SearchBar from '@/components/search-bar';

type NavbarProps = {
    hideLink?: 'login' | 'register';
};

export default function Navbar({ hideLink }: NavbarProps) {
    return (
        <>
            <nav className="bg-background h-16 border-b">
                <div className="mx-auto flex h-full max-w-(--breakpoint-xl) items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                    <div>
                        <Link href="/" className="text-2xl">
                            <Logo />
                        </Link>
                    </div>
                    <div className="hidden flex-1 items-center justify-end md:flex">
                        <SearchBar />
                    </div>
                    <div className="flex items-center justify-between">
                        <NavMenu hideLink={hideLink} />
                        <ModeToggle />
                    </div>
                </div>
            </nav>
            <div className="md:hidden">
                <SearchBar />
            </div>
        </>
    );
}
