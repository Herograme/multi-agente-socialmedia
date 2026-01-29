/**
 * Puppeteer Configuration
 *
 * On ARM64 systems (like Oracle Cloud aarch64), use system Chromium
 * instead of downloading x86_64 Chrome which won't run.
 *
 * Set PUPPETEER_EXECUTABLE_PATH environment variable for runtime:
 *   export PUPPETEER_EXECUTABLE_PATH=/snap/bin/chromium
 */

const os = require('os');
const fs = require('fs');

const isArm64 = os.arch() === 'arm64';

// Find Chromium on ARM64 systems (snap is preferred on Ubuntu)
const findChromiumPath = () => {
  const paths = [
    '/snap/bin/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // ignore
    }
  }
  return undefined;
};

module.exports = {
  // Skip Chrome download on ARM64 - use system Chromium instead
  skipDownload: isArm64,

  // Default executable path for ARM64 systems
  executablePath: isArm64 ? findChromiumPath() : undefined,
};
