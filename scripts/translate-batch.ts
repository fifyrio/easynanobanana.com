import { spawn } from "child_process";
import path from "path";

const LANGUAGES = [
  "zh",  // Chinese (Simplified)
  "de",  // German
  "es",  // Spanish
  "fr",  // French
  "it",  // Italian
  "pt",  // Portuguese
  "ja",  // Japanese
  "ko",  // Korean
  "ru",  // Russian
  "vi",  // Vietnamese
  "th",  // Thai
  "id",  // Indonesian
];

const DEFAULT_LANGUAGES = LANGUAGES;

interface TranslateOptions {
  incremental?: boolean;
  newOnly?: boolean;
  parallel?: boolean;
}

const parseArgs = (): { languages: string[]; options: TranslateOptions } => {
  const args = process.argv.slice(2);
  const languages: string[] = [];
  const options: TranslateOptions = {
    incremental: false,
    newOnly: false,
    parallel: false,
  };

  for (const arg of args) {
    if (arg === "--incremental") {
      options.incremental = true;
    } else if (arg === "--new-only") {
      options.newOnly = true;
    } else if (arg === "--parallel") {
      options.parallel = true;
    } else if (!arg.startsWith("--")) {
      languages.push(arg);
    }
  }

  return {
    languages: languages.length > 0 ? languages : DEFAULT_LANGUAGES,
    options,
  };
};

const runTranslation = (
  locale: string,
  options: TranslateOptions
): Promise<{ locale: string; success: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const args = ["tsx", "scripts/translate.ts", locale];

    if (options.incremental) {
      args.push("--incremental");
    } else if (options.newOnly) {
      args.push("--new-only");
    }

    console.log(`\n━━━ Starting translation for ${locale} ━━━`);
    console.log(`Command: pnpm ${args.join(" ")}`);

    const child = spawn("pnpm", args, {
      stdio: "inherit",
      cwd: path.resolve(__dirname, ".."),
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`✓ ${locale} translation completed successfully\n`);
        resolve({ locale, success: true });
      } else {
        console.error(`✗ ${locale} translation failed with code ${code}\n`);
        resolve({ locale, success: false, error: `Exit code ${code}` });
      }
    });

    child.on("error", (error) => {
      console.error(`✗ ${locale} translation error:`, error.message);
      resolve({ locale, success: false, error: error.message });
    });
  });
};

const runSequential = async (
  languages: string[],
  options: TranslateOptions
) => {
  const results: Array<{ locale: string; success: boolean; error?: string }> = [];

  for (const locale of languages) {
    const result = await runTranslation(locale, options);
    results.push(result);
  }

  return results;
};

const runParallel = async (
  languages: string[],
  options: TranslateOptions
) => {
  const promises = languages.map((locale) => runTranslation(locale, options));
  return await Promise.all(promises);
};

const main = async () => {
  const { languages, options } = parseArgs();

  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║         Batch Translation Script                      ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log("");
  console.log("Languages to translate:", languages.join(", "));
  console.log(
    "Mode:",
    options.newOnly
      ? "New keys only"
      : options.incremental
        ? "Incremental"
        : "Full"
  );
  console.log("Execution:", options.parallel ? "Parallel" : "Sequential");
  console.log("");

  const startTime = Date.now();

  const results = options.parallel
    ? await runParallel(languages, options)
    : await runSequential(languages, options);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║                   Summary Report                      ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`Total: ${results.length} languages`);
  console.log(`✓ Successful: ${successful.length}`);
  if (successful.length > 0) {
    console.log(`  ${successful.map((r) => r.locale).join(", ")}`);
  }

  if (failed.length > 0) {
    console.log(`✗ Failed: ${failed.length}`);
    failed.forEach((r) => {
      console.log(`  ${r.locale}: ${r.error}`);
    });
  }

  console.log(`\nTotal time: ${duration}s`);

  if (failed.length > 0) {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error("Batch translation script failed:", error);
  process.exit(1);
});
