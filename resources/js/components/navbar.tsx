import Logo from '@/components/logo';
import { Link } from '@inertiajs/react';
import { ModeToggle } from '@/components/mode-toggle';
import NavMenu from '@/components/nav-menu';

export default function Navbar() {
    return (
        <nav className="bg-background h-16 border-b">
            <div className="mx-auto flex h-full max-w-(--breakpoint-xl) items-center justify-between px-4 sm:px-6 lg:px-8">
                <div>
                    <Link href="/" className="text-2xl">
                        <Logo />
                    </Link>
                </div>
                <div className="flex items-center justify-between">
                    <NavMenu />
                    <ModeToggle />
                </div>
            </div>
        </nav>
    );
}
