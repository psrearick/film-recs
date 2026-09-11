import { execFileSync } from 'node:child_process';

export default function globalTeardown() {
    execFileSync(
        'vendor/bin/sail',
        [
            'artisan',
            'tinker',
            '--execute',
            'App\\Models\\User::where("email", "like", "playwright-%@example.test")->delete();',
        ],
        { stdio: 'inherit' },
    );
}
