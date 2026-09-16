import { store } from '@/routes/login';
import { Form, setLayoutProps } from '@inertiajs/react';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
    setLayoutProps({ title: 'Sign in', hideNavbarLink: 'login' });

    return (
        <main className="mt-12 flex w-full flex-col items-center p-6 lg:p-8">
            <div className="w-full max-w-xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Sign in</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...store.form()} className="flex flex-col gap-4">
                            {({ errors }) => (
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="email">
                                            Email
                                        </FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                        />
                                        <FieldError>
                                            {errors['email']}
                                        </FieldError>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="password">
                                            Password
                                        </FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                        />
                                        <FieldError>
                                            {errors['password']}
                                        </FieldError>
                                    </Field>
                                    <Field orientation="horizontal">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                        />
                                        <FieldLabel
                                            htmlFor="remember"
                                            className="font-normal"
                                        >
                                            Remember me
                                        </FieldLabel>
                                    </Field>
                                    <Button variant="default" type="submit">
                                        Sign in
                                    </Button>
                                </FieldGroup>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
