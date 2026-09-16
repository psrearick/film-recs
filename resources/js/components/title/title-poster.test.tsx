import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import TitlePoster from './title-poster';

describe('TitlePoster', () => {
    it('renders a fallback icon when there is no poster path', () => {
        const { container } = render(
            <TitlePoster path={null} name="The Matrix" />,
        );

        expect(container.querySelector('img')).not.toBeInTheDocument();
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders the tmdb image when a poster path is given', () => {
        render(<TitlePoster path="/matrix.jpg" name="The Matrix" />);

        expect(screen.getByAltText('The Matrix')).toHaveAttribute(
            'src',
            'https://image.tmdb.org/t/p/w185/matrix.jpg',
        );
    });

    it('uses the given image size when building the tmdb url', () => {
        render(
            <TitlePoster
                path="/matrix.jpg"
                name="The Matrix"
                imageSize="w500"
            />,
        );

        expect(screen.getByAltText('The Matrix')).toHaveAttribute(
            'src',
            'https://image.tmdb.org/t/p/w500/matrix.jpg',
        );
    });
});
