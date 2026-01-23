import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config();

const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
const wranglerCmd = process.env.WRANGLER_CMD || 'npx wrangler';

if (!namespaceId) {
  throw new Error('Missing CLOUDFLARE_KV_NAMESPACE_ID in environment.');
}

const items = [
  { key: 'ai-hairstyle-presets', file: 'src/data/ai-hairstyle-presets.json' },
  { key: 'ai-nail-color-presets', file: 'src/data/ai-nail-color-presets.json' },
  { key: 'virtual-jewelry-try-on', file: 'src/data/virtual-jewelry-try-on.json' },
];

const missingFiles = items.filter((item) => !fs.existsSync(path.join(process.cwd(), item.file)));
if (missingFiles.length > 0) {
  throw new Error(`Missing data files: ${missingFiles.map((item) => item.file).join(', ')}`);
}

for (const item of items) {
  const cmd = `${wranglerCmd} kv:key put "${item.key}" --namespace-id "${namespaceId}" --path "${item.file}"`;
  const result = spawnSync(cmd, { shell: true, stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
