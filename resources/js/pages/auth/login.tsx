import {Form, Link} from "@inertiajs/react";

export default function Login() {
    return (
        <>
            <div className="flex min-h-screen flex-col items-center bg-gray-100 text-gray-900 lg:justify-center dark:bg-gray-950 dark:text-gray-100">
                <div className="w-full opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <nav className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-6">
                        <Link href="/" className="text-2xl text-white">FilmRecs</Link>
                        <Link href="/register" className="text-blue-300 hover:text-blue-500">Register</Link>
                    </nav>
                    <main className="p-6 lg:p-8 flex flex-col items-center w-full">
                        <div className="pt-8 pb-12">
                            <h1 className="text-2xl text-white">Login</h1>
                        </div>
                        <div className="w-full max-w-xl">
                            <Form action="/login" method="POST" className="flex flex-col gap-4">
                                {({ errors }) => (
                                    <>
                                        {errors['email'] && <span className="text-red-600 text-sm">{errors['email']}</span>}
                                        <input className="dark:bg-gray-600 p-2 text-white" type="email" name="email" placeholder="Email" />
                                        {errors['password'] && <span className="text-red-600 text-sm">{errors['password']}</span>}
                                        <input className="dark:bg-gray-600 p-2 text-white" type="password" name="password" placeholder="Password" />
                                        <button className="hover:dark:bg-gray-700 dark:bg-gray-800 text-white p-2" type="submit">Login</button>
                                    </>
                                )}
                            </Form>
                        </div>
                    </main>
                </div>
            </div>
        </>
    )
}
