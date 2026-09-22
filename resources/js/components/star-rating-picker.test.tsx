import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import StarRatingPicker from './star-rating-picker';

function renderPicker(
    props: Partial<React.ComponentProps<typeof StarRatingPicker>> = {},
) {
    const onHover = vi.fn();
    const onSelect = vi.fn();
    const utils = render(
        <StarRatingPicker
            value={0}
            hoverValue={0}
            onHover={onHover}
            onSelect={onSelect}
            {...props}
        />,
    );
    const stars = utils.container.querySelectorAll('svg');

    return { ...utils, stars, onHover, onSelect };
}

describe('StarRatingPicker', () => {
    it('renders ten stars', () => {
        const { stars } = renderPicker();

        expect(stars).toHaveLength(10);
    });

    it('fills stars up to the current value', () => {
        const { stars } = renderPicker({ value: 4 });

        stars.forEach((star, index) => {
            if (index < 4) {
                expect(star).toHaveClass('fill-amber-400');
            } else {
                expect(star).not.toHaveClass('fill-amber-400');
            }
        });
    });

    it('fills stars up to the hover value instead of the selected value while hovering', () => {
        const { stars } = renderPicker({ value: 2, hoverValue: 6 });

        expect(stars[5]).toHaveClass('fill-amber-400');
        expect(stars[6]).not.toHaveClass('fill-amber-400');
    });

    it('calls onHover with the star value on mouse enter', () => {
        const { stars, onHover } = renderPicker();

        fireEvent.mouseEnter(stars[2]);

        expect(onHover).toHaveBeenCalledWith(3);
    });

    it('calls onSelect with the star value when clicked', () => {
        const { stars, onSelect } = renderPicker();

        fireEvent.click(stars[6]);

        expect(onSelect).toHaveBeenCalledWith(7);
    });

    it('calls onHover with 0 when the mouse leaves the picker', () => {
        const { container, onHover } = renderPicker();

        fireEvent.mouseLeave(container.firstChild as Element);

        expect(onHover).toHaveBeenCalledWith(0);
    });
});
