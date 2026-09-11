import { home, register } from '@/routes';
import { store } from '@/routes/login';
import { Form, Link } from '@inertiajs/react';

export default function Login() {
    return (
        <>
            <div className="flex min-h-screen flex-col items-center bg-gray-100 text-gray-900 lg:justify-center dark:bg-gray-950 dark:text-gray-100">
                <div className="w-full opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <nav className="flex items-center justify-between bg-gray-100 p-6 dark:bg-gray-800">
                        <Link href={home()} className="text-2xl text-white">
                            <img
                                src="/logo.png"
                                alt="FilmRecs Logo"
                                className="h-12"
                            />
                        </Link>
                        <Link
                            href={register()}
                            className="text-blue-300 hover:text-blue-500"
                        >
                            Register
                        </Link>
                    </nav>
                    <main className="flex w-full flex-col items-center p-6 lg:p-8">
                        <div className="pt-8 pb-12">
                            <h1 className="text-2xl text-white">Login</h1>
                        </div>
                        <div className="w-full max-w-xl">
                            <Form
                                {...store.form()}
                                className="flex flex-col gap-4"
                            >
                                {({ errors }) => (
                                    <>
                                        {errors['email'] && (
                                            <span className="text-sm text-red-600">
                                                {errors['email']}
                                            </span>
                                        )}
                                        <input
                                            className="p-2 text-white dark:bg-gray-600"
                                            type="email"
                                            name="email"
                                            placeholder="Email"
                                        />
                                        {errors['password'] && (
                                            <span className="text-sm text-red-600">
                                                {errors['password']}
                                            </span>
                                        )}
                                        <input
                                            className="p-2 text-white dark:bg-gray-600"
                                            type="password"
                                            name="password"
                                            placeholder="Password"
                                        />
                                        <button
                                            className="p-2 text-white dark:bg-gray-800 hover:dark:bg-gray-700"
                                            type="submit"
                                        >
                                            Login
                                        </button>
                                    </>
                                )}
                            </Form>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
