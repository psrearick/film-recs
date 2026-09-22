import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Link, usePage } from '@inertiajs/react';
import { login, register } from '@/routes';
import NavbarAccountPopover from '@/components/navbar-account-popover';

type NavMenuProps = {
    hideLink?: 'login' | 'register';
};

export default function NavMenu({ hideLink }: NavMenuProps) {
    const { auth } = usePage().props;
    return (
        <NavigationMenu>
            <NavigationMenuList>
                {auth.user ? (
                    <NavigationMenuItem>
                        <NavbarAccountPopover />
                    </NavigationMenuItem>
                ) : (
                    <>
                        {hideLink !== 'login' && (
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href={login()}>Sign in</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        )}
                        {hideLink !== 'register' && (
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href={register()}>Register</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        )}
                    </>
                )}
            </NavigationMenuList>
        </NavigationMenu>
    );
}
