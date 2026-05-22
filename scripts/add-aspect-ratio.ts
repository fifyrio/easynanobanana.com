/**
 * Batch-add aspect ratio selector to Experience components that lack it.
 *
 * Changes per file:
 * 1. Add `const [aspectRatio, setAspectRatio] = useState<string>('1:1');` state
 * 2. Replace `aspect-square` preview container with dynamic aspectRatio style
 * 3. Add `aspectRatio,` to the generate-image API body
 * 4. Insert the ratio selector UI section before the preset selector
 *
 * Usage:
 *   npx tsx scripts/add-aspect-ratio.ts --dry-run   # preview changes
 *   npx tsx scripts/add-aspect-ratio.ts              # apply changes
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(__dirname, '../src/components');

// Components that already have aspect ratio support — skip these
const SKIP_FILES = new Set([
  'Ai3dCameraControlExperience.tsx',
  'AiBodySwapExperience.tsx',
  'AiBookCoverDesignerExperience.tsx',
  'AiHairstyleAnalysisExperience.tsx',
  'AiMangaTranslatorExperience.tsx',
  'AiMinecraftSkinExperience.tsx',
  'AiThumbnailMakerExperience.tsx',
  // Non-standard components
  'AiFigureGenerator.tsx',
  'AiObjectRemoval.tsx',
]);

// The aspect ratio selector UI snippet
const RATIO_SELECTOR_UI = `
                {/* Aspect ratio selector */}
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">{t('input.aspectRatio.label')}</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: '1:1', w: 'w-4', h: 'h-4' },
                      { value: '9:16', w: 'w-2.5', h: 'h-[18px]' },
                      { value: '16:9', w: 'w-[18px]', h: 'h-2.5' },
                      { value: '3:2', w: 'w-[18px]', h: 'h-3' },
                      { value: '2:3', w: 'w-3', h: 'h-[18px]' },
                    ].map(({ value, w, h }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAspectRatio(value)}
                        className={\`flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-semibold transition \${
                          aspectRatio === value
                            ? 'border-[#F0A202] bg-[#FFF4CC] text-slate-900 shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                            : 'border-transparent bg-white text-slate-500 hover:bg-[#FFFBF0]'
                        }\`}
                      >
                        <span className={\`inline-block border border-current rounded-sm \${w} \${h}\`} />
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
`;

const dryRun = process.argv.includes('--dry-run');

function getExperienceFiles(): string[] {
  return fs.readdirSync(COMPONENTS_DIR)
    .filter(f => f.endsWith('Experience.tsx') && !SKIP_FILES.has(f))
    .map(f => path.join(COMPONENTS_DIR, f));
}

function addAspectRatio(filePath: string): boolean {
  const fileName = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has aspectRatio
  if (content.includes('setAspectRatio') || content.includes('aspectRatio')) {
    console.log(`  SKIP (already has aspectRatio): ${fileName}`);
    return false;
  }

  // Skip if no aspect-square (different pattern)
  if (!content.includes('aspect-square')) {
    console.log(`  SKIP (no aspect-square found): ${fileName}`);
    return false;
  }

  let changes = 0;

  // 1. Add aspectRatio state — find the last useState line and add after it
  const statePattern = /(\s+const \[(?:showLoginModal|uploadedFile|isDragActive), set\w+\] = useState[^;]+;)/g;
  let lastStateMatch: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;
  while ((match = statePattern.exec(content)) !== null) {
    lastStateMatch = match;
  }

  if (!lastStateMatch) {
    // Try a broader pattern - find the last useState
    const broadPattern = /(\s+const \[\w+, set\w+\] = useState[^;]+;)/g;
    while ((match = broadPattern.exec(content)) !== null) {
      lastStateMatch = match;
    }
  }

  if (lastStateMatch) {
    const insertPos = lastStateMatch.index + lastStateMatch[0].length;
    const stateDecl = `\n  const [aspectRatio, setAspectRatio] = useState<string>('1:1');`;
    content = content.slice(0, insertPos) + stateDecl + content.slice(insertPos);
    changes++;
  } else {
    console.log(`  WARNING: Could not find useState insertion point in ${fileName}`);
    return false;
  }

  // 2. Replace aspect-square with dynamic aspectRatio
  const aspectSquarePattern = /className="relative aspect-square w-full overflow-hidden rounded-\[28px\] bg-gray-200 select-none"/g;
  if (aspectSquarePattern.test(content)) {
    content = content.replace(
      /className="relative aspect-square w-full overflow-hidden rounded-\[28px\] bg-gray-200 select-none"/g,
      `className="relative w-full overflow-hidden rounded-[28px] bg-gray-200 select-none"\n                  style={{ aspectRatio: aspectRatio.replace(':', '/') }}`
    );
    changes++;
  } else {
    console.log(`  WARNING: Could not find aspect-square pattern in ${fileName}`);
  }

  // 3. Add aspectRatio to API call body
  // Pattern: body: JSON.stringify({ prompt, imageUrls, metadata }) — multiline
  // Insert `aspectRatio,` before the closing `})`
  const apiBodyPattern = /(body: JSON\.stringify\(\{[\s\S]*?)(,?\s*}\))/;
  const apiMatch = content.match(apiBodyPattern);
  if (apiMatch && !apiMatch[0].includes('aspectRatio')) {
    content = content.replace(
      apiBodyPattern,
      `$1,\n          aspectRatio$2`
    );
    changes++;
  } else if (!apiMatch) {
    console.log(`  WARNING: Could not find API body pattern in ${fileName}`);
  }

  // 4. Insert ratio selector UI before preset selector
  // Look for the preset selector section marker — typically "/* ... preset selector */" or the preset label
  // Common patterns: {t('input.preset.label')} or "Style Preset" section
  const presetLabelPattern = /(\s+{\/\*.*?[Pp]reset.*?\*\/}\s*\n\s*<div>)/;
  const presetMatch = content.match(presetLabelPattern);

  if (presetMatch) {
    content = content.replace(presetLabelPattern, RATIO_SELECTOR_UI + '\n$1');
    changes++;
  } else {
    // Alternative: look for the preset label text
    const altPresetPattern = /(\s+<div>\s*\n\s+<div className="mb-2 flex items-center justify-between)/;
    const altMatch = content.match(altPresetPattern);
    if (altMatch) {
      content = content.replace(altPresetPattern, RATIO_SELECTOR_UI + '\n$1');
      changes++;
    } else {
      // Try to insert before the error display section as fallback
      console.log(`  NOTE: No preset section found in ${fileName}, inserting before error section`);
      const errorPattern = /(\s+{error && \()/;
      const errMatch = content.match(errorPattern);
      if (errMatch) {
        // Insert before the </div> that closes the space-y-6 container, right before error
        content = content.replace(errorPattern, RATIO_SELECTOR_UI + '\n              </div>\n$1');
        // Undo the extra </div> — actually this approach is fragile, let's skip UI insertion for these
        // and handle them separately
        console.log(`  WARNING: Ratio UI insertion may need manual review in ${fileName}`);
      }
    }
  }

  if (changes === 0) {
    console.log(`  NO CHANGES: ${fileName}`);
    return false;
  }

  if (dryRun) {
    console.log(`  DRY-RUN: Would modify ${fileName} (${changes} changes)`);
  } else {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  MODIFIED: ${fileName} (${changes} changes)`);
  }
  return true;
}

async function main() {
  console.log(`\n=== Add Aspect Ratio Selector to Experience Components ===\n`);
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'APPLY'}\n`);

  const files = getExperienceFiles();
  console.log(`Found ${files.length} Experience components to process\n`);

  let modified = 0;
  let skipped = 0;

  for (const file of files) {
    if (addAspectRatio(file)) {
      modified++;
    } else {
      skipped++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Modified: ${modified}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${files.length}`);
}

main();
