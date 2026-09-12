import { Head, Link, usePage } from '@inertiajs/react';
import { ModeToggle } from '@/components/mode-toggle';

export default function Welcome() {
    const { auth } = usePage().props;
    return (
        <>
            <Head title="Welcome" />
            <div className="bg-background text-foreground flex min-h-screen flex-col items-center lg:justify-center">
                <div className="flex w-full flex-col opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <nav className="bg-card flex items-center justify-between p-4">
                        <Link href="/" className="text-2xl">
                            <img
                                src="/logo.png"
                                alt="FilmRecs Logo"
                                className="h-12"
                            />
                        </Link>
                        <div className="flex items-center gap-6">
                            {auth.user ? (
                                <div>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="text-primary hover:text-primary/70"
                                    >
                                        Logout
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-6">
                                    <div>
                                        <Link
                                            href="/login"
                                            className="text-primary hover:text-primary/70"
                                        >
                                            Login
                                        </Link>
                                    </div>
                                    <div>
                                        <Link
                                            href="/register"
                                            className="text-primary hover:text-primary/70"
                                        >
                                            Register
                                        </Link>
                                    </div>
                                </div>
                            )}
                            <ModeToggle />
                        </div>
                    </nav>
                    <main className="flex h-full w-full p-6 lg:p-8">
                        <p>Welcome</p>
                    </main>
                </div>
            </div>
        </>
    );
}
