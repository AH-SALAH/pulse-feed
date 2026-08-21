/** @type {import('@lhci/cli').LHCI} */
module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000/en", "http://localhost:3000/ar"],
      numberOfRuns: 1,
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready in",
      settings: {
        chromeFlags: "--no-sandbox --headless",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};