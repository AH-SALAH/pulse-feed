import { getSiteUrl } from "./lib/site-url.js";

const baseURL = getSiteUrl();

/** @type {import('@lhci/cli').LHCI} */
const config = {
  ci: {
    collect: {
      url: [`${baseURL}/en`, `${baseURL}/ar`],
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

export default config;
