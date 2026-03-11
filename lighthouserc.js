// Lighthouse CI configuration for Life OS
// Targets: Performance 90+, Accessibility 95+, Best Practices 90+, SEO 90+

/** @type {import('@lhci/utils/src/config').LhrConfig} */
module.exports = {
    ci: {
        collect: {
            url: [
                'http://localhost:3000/',
                'http://localhost:3000/login',
            ],
            numberOfRuns: 3,
            settings: {
                // Simulate mobile 4G (Indian market target)
                throttlingMethod: 'simulate',
                throttling: {
                    rttMs: 40,
                    throughputKbps: 10240,
                    cpuSlowdownMultiplier: 4,
                },
                formFactor: 'mobile',
                screenEmulation: {
                    mobile: true,
                    width: 390,
                    height: 844,
                    deviceScaleFactor: 3,
                },
            },
        },
        assert: {
            assertions: {
                'categories:performance': ['warn', { minScore: 0.85 }],
                'categories:accessibility': ['error', { minScore: 0.90 }],
                'categories:best-practices': ['warn', { minScore: 0.90 }],
                'categories:seo': ['warn', { minScore: 0.90 }],
                // Core Web Vitals
                'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
                'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
                'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
                'total-blocking-time': ['warn', { maxNumericValue: 300 }],
                // Security
                'uses-https': 'warn',
                'no-vulnerable-libraries': 'warn',
                'csp-xss': 'warn',
            },
        },
        upload: {
            target: 'temporary-public-storage',
        },
    },
}
