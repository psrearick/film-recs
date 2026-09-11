import { execFileSync } from 'node:child_process';

export default function globalSetup() {
    execFileSync(
        'vendor/bin/sail',
        [
            'artisan',
            'tinker',
            '--execute',
            'App\\Models\\User::updateOrCreate(["email" => "playwright-login@example.test"], ["name" => "Playwright Login User", "password" => Hash::make("password")]);',
        ],
        { stdio: 'inherit' },
    );
}
