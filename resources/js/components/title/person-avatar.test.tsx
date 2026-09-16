import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import PersonAvatar from './person-avatar';

describe('PersonAvatar', () => {
    it('renders a fallback icon when there is no profile path', () => {
        const { container } = render(
            <PersonAvatar path={null} name="Keanu Reeves" />,
        );

        expect(container.querySelector('img')).not.toBeInTheDocument();
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders the tmdb image when a profile path is given', () => {
        render(<PersonAvatar path="/keanu.jpg" name="Keanu Reeves" />);

        expect(screen.getByAltText('Keanu Reeves')).toHaveAttribute(
            'src',
            'https://image.tmdb.org/t/p/w185/keanu.jpg',
        );
    });
});
