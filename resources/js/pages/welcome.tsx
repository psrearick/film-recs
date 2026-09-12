import { Head } from '@inertiajs/react';
import Navbar from '@/components/navbar';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col items-center lg:justify-center">
                <div className="flex w-full flex-col opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <Navbar />
                    <main className="flex h-full w-full p-6 lg:p-8">
                        <p>Welcome</p>
                    </main>
                </div>
            </div>
        </>
    );
}
