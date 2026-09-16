import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import Logo from './logo';

describe('Logo', () => {
    it('renders the FilmRecs logo image', () => {
        render(<Logo />);

        const image = screen.getByAltText('FilmRecs Logo');
        expect(image).toHaveAttribute('src', '/logo.png');
    });
});
