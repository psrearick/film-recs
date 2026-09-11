import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage().props;
    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col items-center bg-gray-100 text-gray-900 lg:justify-center dark:bg-gray-950 dark:text-gray-100">
                <div className="flex w-full flex-col opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <nav className="flex items-center justify-between bg-gray-100 p-4 dark:bg-gray-900">
                        <Link href="/" className="text-2xl text-white">
                            <img src="/logo.png" alt="FilmRecs Logo" className="h-12" />
                        </Link>
                        <div>
                            {auth.user ? (
                                <div>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="text-blue-300 hover:text-blue-500"
                                    >
                                        Logout
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-6">
                                    <div>
                                        <Link
                                            href="/login"
                                            className="text-blue-300 hover:text-blue-500"
                                        >
                                            Login
                                        </Link>
                                    </div>
                                    <div>
                                        <Link
                                            href="/register"
                                            className="text-blue-300 hover:text-blue-500"
                                        >
                                            Register
                                        </Link>
                                    </div>
                                </div>
                            )}
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
