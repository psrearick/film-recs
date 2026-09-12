import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Link, usePage } from '@inertiajs/react';
import { logout, login, register } from '@/routes';

export default function NavMenu() {
    const { auth } = usePage().props;
    return (
        <NavigationMenu>
            <NavigationMenuList>
                {auth.user ? (
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                            <Link href={logout()} method="post" as="button">
                                Logout
                            </Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                ) : (
                    <>
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link href={login()}>Sign in</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link href={register()}>Register</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    </>
                )}
            </NavigationMenuList>
        </NavigationMenu>
    );
}
