import path from 'node:path';

export default {
    '*.{js,jsx,ts,tsx,css}': (files) =>
        `vendor/bin/sail npm exec -- vp check --fix ${files
            .map((file) => path.relative(process.cwd(), file))
            .join(' ')}`,
    '*.php': (files) =>
        `vendor/bin/sail bin pint ${files
            .map((file) => path.relative(process.cwd(), file))
            .join(' ')}`,
};
