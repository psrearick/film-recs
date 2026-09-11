import path from 'node:path';

export default {
    '*.{js,jsx,ts,tsx,css}': 'vp check --fix',
    '*.php': (files) =>
        `vendor/bin/sail bin pint ${files
            .map((file) => path.relative(process.cwd(), file))
            .join(' ')}`,
};
