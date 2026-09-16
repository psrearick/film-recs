import { setLayoutProps } from '@inertiajs/react';

const Welcome = () => {
    setLayoutProps({ title: 'Welcome' });

    return (
        <main className="flex h-full w-full p-6 lg:p-8">
            <p>Welcome</p>
        </main>
    );
};

export default Welcome;
