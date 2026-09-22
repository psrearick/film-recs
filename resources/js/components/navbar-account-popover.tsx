import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { NavigationMenuLink } from '@/components/ui/navigation-menu';
import { Link } from '@inertiajs/react';
import { User } from 'lucide-react';
import { logout, ratings } from '@/routes';
import { useState } from 'react';

export default function NavbarAccountPopover() {
    const [isOpen, setIsOpen] = useState(false);
    const closePopover = () => setIsOpen(false);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Account menu"
                >
                    <User className="size-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-64"
                onOpenAutoFocus={(event) => event.preventDefault()}
            >
                <NavigationMenuLink asChild>
                    <Link
                        className="hover:cursor-pointer"
                        onClick={closePopover}
                        href={ratings()}
                        as="button"
                    >
                        Your Ratings
                    </Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                    <Link
                        className="hover:cursor-pointer"
                        onClick={closePopover}
                        href={logout()}
                        method="post"
                        as="button"
                    >
                        Logout
                    </Link>
                </NavigationMenuLink>
            </PopoverContent>
        </Popover>
    );
}
