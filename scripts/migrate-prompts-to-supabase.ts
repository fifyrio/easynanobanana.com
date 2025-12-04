/**
 * Data Migration Script: JSON to Supabase
 *
 * Migrates prompt data from local JSON files to Supabase database
 *
 * Usage:
 *   pnpm tsx scripts/migrate-prompts-to-supabase.ts [locale]
 *
 * Examples:
 *   pnpm tsx scripts/migrate-prompts-to-supabase.ts en
 *   pnpm tsx scripts/migrate-prompts-to-supabase.ts all
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface JSONPrompt {
  id: number;
  title: string;
  prompt: string;
  imageUrl: string;
  tags: string[];
  category: string;
  author: string;
  authorUrl?: string;
}

interface SupabasePrompt {
  id?: number;
  title: string;
  prompt: string;
  image_url: string;
  tags: string[];
  category: string;
  author: string;
  author_url?: string;
  locale: string;
  is_published: boolean;
}

async function loadPromptsFromJSON(locale: string): Promise<JSONPrompt[]> {
  const filePath = path.join(
    __dirname,
    '../data/nano-banana-prompts',
    `prompts-${locale}.json`
  );

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const prompts = JSON.parse(fileContent);

    if (!Array.isArray(prompts)) {
      throw new Error('JSON file must contain an array of prompts');
    }

    return prompts;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`⚠️  File not found: ${filePath}`);
      return [];
    }
    throw error;
  }
}

function transformPrompt(
  jsonPrompt: JSONPrompt,
  locale: string
): SupabasePrompt {
  return {
    // Don't include id to let Supabase auto-generate it
    title: jsonPrompt.title || 'Untitled Prompt',
    prompt: jsonPrompt.prompt,
    image_url: jsonPrompt.imageUrl,
    tags: jsonPrompt.tags || [],
    category: jsonPrompt.category || '',
    author: jsonPrompt.author || 'Anonymous',
    author_url: jsonPrompt.authorUrl || '',
    locale,
    is_published: true, // MVP: All migrated prompts are published by default
  };
}

async function migrateLocale(locale: string): Promise<void> {
  console.log(`\n📦 Processing locale: ${locale}`);
  console.log('─'.repeat(50));

  // Load prompts from JSON
  const jsonPrompts = await loadPromptsFromJSON(locale);

  if (jsonPrompts.length === 0) {
    console.log(`⚠️  No prompts found for locale: ${locale}`);
    return;
  }

  console.log(`✓ Loaded ${jsonPrompts.length} prompts from JSON`);

  // Transform prompts
  const supabasePrompts = jsonPrompts.map(p => transformPrompt(p, locale));

  // Check for existing prompts
  const { data: existingPrompts, error: fetchError } = await supabase
    .from('prompts')
    .select('id, title, locale')
    .eq('locale', locale);

  if (fetchError) {
    console.error(`❌ Error checking existing prompts:`, fetchError);
    throw fetchError;
  }

  console.log(`ℹ️  Found ${existingPrompts?.length || 0} existing prompts in database`);

  // Ask user for confirmation in interactive mode
  const shouldDelete = existingPrompts && existingPrompts.length > 0;

  if (shouldDelete) {
    console.log(`\n⚠️  WARNING: This will delete ${existingPrompts.length} existing prompts!`);
    console.log(`   Proceeding with migration...`);

    // Delete existing prompts for this locale
    const { error: deleteError } = await supabase
      .from('prompts')
      .delete()
      .eq('locale', locale);

    if (deleteError) {
      console.error(`❌ Error deleting existing prompts:`, deleteError);
      throw deleteError;
    }

    console.log(`✓ Deleted ${existingPrompts.length} existing prompts`);
  }

  // Insert new prompts in batches (Supabase recommends batches of 1000)
  const batchSize = 1000;
  let inserted = 0;

  for (let i = 0; i < supabasePrompts.length; i += batchSize) {
    const batch = supabasePrompts.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('prompts')
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      throw error;
    }

    inserted += data?.length || 0;
    console.log(`✓ Inserted batch ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} prompts`);
  }

  console.log(`\n✅ Successfully migrated ${inserted} prompts for locale: ${locale}`);
}

async function migrateAll(): Promise<void> {
  const supportedLocales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'vi', 'th', 'id', 'it'];

  console.log('🚀 Starting migration for all locales...\n');

  let successCount = 0;
  let failCount = 0;

  for (const locale of supportedLocales) {
    try {
      await migrateLocale(locale);
      successCount++;
    } catch (error) {
      console.error(`\n❌ Failed to migrate locale: ${locale}`);
      console.error(error);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${successCount} locales`);
  console.log(`❌ Failed: ${failCount} locales`);
  console.log('='.repeat(50) + '\n');
}

async function main() {
  const locale = process.argv[2];

  if (!locale) {
    console.error('❌ Usage: pnpm tsx scripts/migrate-prompts-to-supabase.ts [locale|all]');
    console.error('   Example: pnpm tsx scripts/migrate-prompts-to-supabase.ts en');
    console.error('   Example: pnpm tsx scripts/migrate-prompts-to-supabase.ts all');
    process.exit(1);
  }

  console.log('🔄 Nano Banana Prompts Data Migration');
  console.log('═'.repeat(50));
  console.log(`Target: Supabase (${NEXT_PUBLIC_SUPABASE_URL})`);
  console.log('═'.repeat(50));

  try {
    if (locale === 'all') {
      await migrateAll();
    } else {
      await migrateLocale(locale);
    }

    console.log('\n✨ Migration completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

main();
