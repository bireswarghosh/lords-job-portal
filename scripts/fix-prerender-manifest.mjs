import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(__dirname, '..', '.next', 'prerender-manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.log('prerender-manifest.json not found, skipping');
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Check if we need to transform (v4 format has routes but empty staticRoutes)
if (manifest.routes && (!manifest.staticRoutes || Object.keys(manifest.staticRoutes || {}).length === 0)) {
  console.log(`Transforming prerender manifest from v4 to v3 format (${Object.keys(manifest.routes).length} routes)`);
  manifest.staticRoutes = manifest.staticRoutes || {};

  for (const [route, entry] of Object.entries(manifest.routes)) {
    manifest.staticRoutes[route] = {
      initialRevalidate: entry.initialRevalidateSeconds,
      initialExpire: entry.initialExpireSeconds,
      // Keep srcRoute as-is for app router pages (they need it for lambda detection)
      srcRoute: (entry.srcRoute === route || entry.sourceRoute === route) ? route : (entry.srcRoute || entry.sourceRoute || null),
      dataRoute: entry.dataRoute,
      allowHeader: entry.allowHeader,
      initialHeaders: entry.initialHeaders,
      initialStatus: entry.initialStatus,
      experimentalBypassFor: entry.experimentalBypassFor,
      renderingMode: entry.renderingMode,
      prefetchDataRoute: entry.prefetchDataRoute,
    };
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Transformation complete');
} else {
  console.log('Manifest already in v3 format or no v4 routes found, skipping');
}
