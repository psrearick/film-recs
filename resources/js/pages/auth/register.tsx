import { store } from '@/routes/register';
import { Form, setLayoutProps } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Register() {
    setLayoutProps({ title: 'Register', hideNavbarLink: 'register' });

    return (
        <main className="mt-12 flex w-full flex-col items-center p-6 lg:p-8">
            <div className="w-full max-w-xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Register</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...store.form()} className="flex flex-col gap-4">
                            {({ errors }) => (
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="name">
                                            Name
                                        </FieldLabel>
                                        <Input
                                            id="name"
                                            type="text"
                                            name="name"
                                        />
                                        <FieldError>
                                            {errors['name']}
                                        </FieldError>
                                    </Field>
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
                                    <Field>
                                        <FieldLabel htmlFor="password_confirmation">
                                            Confirm Password
                                        </FieldLabel>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                        />
                                        <FieldError>
                                            {errors['password_confirmation']}
                                        </FieldError>
                                    </Field>
                                    <Button variant="default" type="submit">
                                        Register
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
