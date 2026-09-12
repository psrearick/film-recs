import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
}));

vi.mock('@/components/navbar', () => ({
    default: () => <nav>Navbar</nav>,
}));

import Welcome from './welcome';

describe('Welcome page', () => {
    it('renders the navbar and a welcome message', () => {
        render(<Welcome />);

        expect(screen.getByRole('navigation')).toBeInTheDocument();
        expect(screen.getByText('Welcome')).toBeInTheDocument();
    });
});
