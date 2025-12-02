import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const BASE_LANG = 'en';

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

/**
 * Deep merge function that adds missing keys from source to target
 * while preserving existing translations in target
 */
function deepMerge(
  source: TranslationObject,
  target: TranslationObject,
  path: string = ''
): { merged: TranslationObject; added: string[] } {
  const merged: TranslationObject = { ...target };
  const added: string[] = [];

  for (const key in source) {
    const currentPath = path ? `${path}.${key}` : key;

    if (!(key in target)) {
      // Key is missing in target, add it from source
      merged[key] = source[key];
      if (typeof source[key] === 'string') {
        added.push(currentPath);
      } else {
        // If it's an object, we need to add all nested keys
        const nestedKeys = getAllKeys(source[key] as TranslationObject, currentPath);
        added.push(...nestedKeys);
      }
    } else if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      // Both are objects, recurse
      const result = deepMerge(
        source[key] as TranslationObject,
        target[key] as TranslationObject,
        currentPath
      );
      merged[key] = result.merged;
      added.push(...result.added);
    }
    // If key exists and is not an object, keep the target value (existing translation)
  }

  return { merged, added };
}

/**
 * Get all keys from a nested object
 */
function getAllKeys(obj: TranslationObject, prefix: string = ''): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'string') {
      keys.push(currentPath);
    } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key] as TranslationObject, currentPath));
    }
  }

  return keys;
}

/**
 * Main function to sync translations
 */
function syncTranslations() {
  console.log('🔄 Starting translation sync...\n');

  // Read base English translation
  const basePath = path.join(MESSAGES_DIR, `${BASE_LANG}.json`);
  if (!fs.existsSync(basePath)) {
    console.error(`❌ Base language file not found: ${basePath}`);
    process.exit(1);
  }

  const baseContent = fs.readFileSync(basePath, 'utf-8');
  const baseTranslations: TranslationObject = JSON.parse(baseContent);

  // Get all translation files
  const files = fs.readdirSync(MESSAGES_DIR).filter((file) => {
    return file.endsWith('.json') && file !== `${BASE_LANG}.json`;
  });

  let totalAdded = 0;
  const results: { lang: string; added: number; keys: string[] }[] = [];

  // Process each translation file
  for (const file of files) {
    const lang = path.basename(file, '.json');
    const filePath = path.join(MESSAGES_DIR, file);

    console.log(`📝 Processing ${lang}.json...`);

    // Read target translation
    const targetContent = fs.readFileSync(filePath, 'utf-8');
    const targetTranslations: TranslationObject = JSON.parse(targetContent);

    // Merge translations
    const { merged, added } = deepMerge(baseTranslations, targetTranslations);

    if (added.length > 0) {
      // Write back the merged content
      fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');

      console.log(`  ✅ Added ${added.length} missing key(s)`);
      results.push({ lang, added: added.length, keys: added });
      totalAdded += added.length;
    } else {
      console.log(`  ✨ No missing keys`);
    }
  }

  // Print summary
  console.log('\n📊 Summary:');
  console.log(`  Total files processed: ${files.length}`);
  console.log(`  Total keys added: ${totalAdded}`);

  if (totalAdded > 0) {
    console.log('\n📋 Details:');
    for (const result of results) {
      if (result.added > 0) {
        console.log(`\n  ${result.lang}.json (${result.added} keys):`);
        result.keys.forEach((key) => {
          console.log(`    - ${key}`);
        });
      }
    }

    console.log('\n⚠️  Note: Missing keys have been filled with English text.');
    console.log('   Please translate them to the appropriate language.');
  }

  console.log('\n✅ Translation sync completed!');
}

// Run the sync
syncTranslations();
