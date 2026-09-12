import { home, login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Link } from '@inertiajs/react';

export default function Register() {
    return (
        <>
            <div className="flex min-h-screen flex-col items-center bg-gray-950 text-gray-100 lg:justify-center">
                <div className="w-full opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <nav className="flex items-center justify-between bg-gray-800 p-6">
                        <Link href={home()} className="text-2xl text-white">
                            <img
                                src="/logo.png"
                                alt="FilmRecs Logo"
                                className="h-12"
                            />
                        </Link>
                        <Link
                            href={login()}
                            className="text-blue-300 hover:text-blue-500"
                        >
                            Login
                        </Link>
                    </nav>
                    <main className="mt-12 flex w-full flex-col items-center p-6 lg:p-8">
                        <div className="flex w-full max-w-xl flex-col rounded-2xl border-2 border-gray-700 bg-gray-900 p-8 shadow shadow-gray-700">
                            <div className="pt-8 pb-12">
                                <h1 className="text-center text-2xl text-white">
                                    Register
                                </h1>
                            </div>
                            <Form
                                {...store.form()}
                                className="flex flex-col gap-4"
                            >
                                {({ errors }) => (
                                    <>
                                        {errors['name'] && (
                                            <span className="text-sm leading-0 text-red-700">
                                                {errors['name']}
                                            </span>
                                        )}
                                        <input
                                            className="mb-6 rounded-lg bg-gray-600 p-2 text-white focus:outline-2 focus:outline-cyan-600"
                                            type="text"
                                            placeholder="Name"
                                            name="name"
                                        />
                                        {errors['email'] && (
                                            <span className="text-sm leading-0 text-red-700">
                                                {errors['email']}
                                            </span>
                                        )}
                                        <input
                                            className="mb-6 rounded-lg bg-gray-600 p-2 text-white focus:outline-2 focus:outline-cyan-600"
                                            type="email"
                                            name="email"
                                            placeholder="Email"
                                        />
                                        {errors['password'] && (
                                            <span className="text-sm leading-0 text-red-700">
                                                {errors['password']}
                                            </span>
                                        )}
                                        <input
                                            className="mb-6 rounded-lg bg-gray-600 p-2 text-white focus:outline-2 focus:outline-cyan-600"
                                            type="password"
                                            name="password"
                                            placeholder="Password"
                                        />
                                        {errors['password_confirmation'] && (
                                            <span className="text-sm leading-0 text-red-700">
                                                {
                                                    errors[
                                                        'password_confirmation'
                                                    ]
                                                }
                                            </span>
                                        )}
                                        <input
                                            className="mb-6 rounded-lg bg-gray-600 p-2 text-white focus:outline-2 focus:outline-cyan-600"
                                            type="password"
                                            name="password_confirmation"
                                            placeholder="Confirm Password"
                                        />
                                        <button
                                            className="rounded-lg bg-black p-2 text-white hover:bg-gray-800 focus:bg-gray-700 focus:outline-0"
                                            type="submit"
                                        >
                                            Register
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
