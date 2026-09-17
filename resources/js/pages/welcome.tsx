import { Link, setLayoutProps, usePage } from '@inertiajs/react';
import { login, register } from '@/routes';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    setLayoutProps({ title: 'Welcome' });
    const { auth } = usePage().props;

    return (
        <main className="flex h-full w-full">
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
        </main>
    );
}
