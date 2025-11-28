import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { OpenAI } from "openai";

// Load .env.local first, then .env as fallback
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { OPENROUTER_API_KEY, OPENROUTER_SITE_URL, OPENROUTER_SITE_NAME } = process.env;

if (!OPENROUTER_API_KEY) {
  console.error("Missing OPENROUTER_API_KEY environment variable.");
  process.exit(1);
}

const LANGUAGES: Record<string, string> = {
  es: "Spanish",
  de: "German",
  fr: "French",
  it: "Italian",
  pt: "Portuguese",
  zh: "Simplified Chinese",
  "zh-TW": "Traditional Chinese",
  ja: "Japanese",
  ko: "Korean",
  ru: "Russian",
  ar: "Arabic",
  nl: "Dutch",
  pl: "Polish",
  vi: "Vietnamese",
  th: "Thai",
};

const locale = process.argv[2];
const isIncrementalMode = process.argv.includes("--incremental");

if (!locale) {
  console.error("Usage: pnpm translate <locale> [--incremental]");
  console.error("Available locales:", Object.keys(LANGUAGES).join(", "));
  console.error("\nOptions:");
  console.error("  --incremental    Only translate missing or untranslated content");
  process.exit(1);
}

if (locale === "en") {
  console.error("Cannot translate to English (source language).");
  process.exit(1);
}

const langName = LANGUAGES[locale];

if (!langName) {
  console.error(`Unknown locale: ${locale}`);
  console.error("Available locales:", Object.keys(LANGUAGES).join(", "));
  process.exit(1);
}

const client = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    ...(OPENROUTER_SITE_URL ? { "HTTP-Referer": OPENROUTER_SITE_URL } : {}),
    ...(OPENROUTER_SITE_NAME ? { "X-Title": OPENROUTER_SITE_NAME } : {})
  }
});

const enPath = path.resolve(__dirname, "../messages/en.json");
const targetPath = path.resolve(__dirname, `../messages/${locale}.json`);

const readLocaleFile = async (filePath: string) => {
  try {
    const file = await fs.readFile(filePath, "utf-8");
    return JSON.parse(file) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const translateContent = async (payload: unknown) => {
  const systemPrompt =
    `You are a precise translation assistant. Translate English text to ${langName}. Return valid JSON with the same keys. Do not translate keys, placeholders (like {name}), or markdown syntax. Maintain arrays and nested objects.`;

  const userPrompt =
    `Translate all string values in this JSON from English to ${langName}. Preserve the original structure and return only JSON without explanations:\n` +
    JSON.stringify(payload, null, 2);

  const response = await client.chat.completions.create({
    model: "openai/gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No translation received from the model.");
  }

  const parsed = JSON.parse(content) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Translation response was not valid JSON.");
  }

  return parsed;
};

const writeLocaleFile = async (filePath: string, data: unknown) => {
  const serialized = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, `${serialized}\n`, "utf-8");
};

// Check if a value needs translation (is a placeholder)
const needsTranslation = (value: unknown): boolean => {
  if (typeof value !== "string") return false;

  // Check for placeholder patterns like "[Japanese translation]"
  const placeholderPattern = /^\[(.*?)\s+translation\]/i;
  return placeholderPattern.test(value);
};

// Extract untranslated content from target file
const extractUntranslated = (
  source: Record<string, unknown>,
  target: Record<string, unknown>
): { content: Record<string, unknown>; count: number } => {
  const untranslated: Record<string, unknown> = {};
  let count = 0;

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = target[key];

    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue)
    ) {
      // Recursively handle nested objects
      const result = extractUntranslated(
        sourceValue as Record<string, unknown>,
        (targetValue as Record<string, unknown>) || {}
      );

      if (Object.keys(result.content).length > 0) {
        untranslated[key] = result.content;
        count += result.count;
      }
    } else if (
      targetValue === undefined ||
      needsTranslation(targetValue)
    ) {
      // Found untranslated value
      untranslated[key] = sourceValue;
      count++;
    }
  }

  return { content: untranslated, count };
};

// Deep merge translations into existing structure
const mergeTranslations = (
  existing: Record<string, unknown>,
  newTranslations: Record<string, unknown>
): Record<string, unknown> => {
  const merged = { ...existing };

  for (const [key, value] of Object.entries(newTranslations)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      merged[key] &&
      typeof merged[key] === "object" &&
      !Array.isArray(merged[key])
    ) {
      // Recursively merge nested objects
      merged[key] = mergeTranslations(
        merged[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      // Replace value
      merged[key] = value;
    }
  }

  return merged;
};

const main = async () => {
  console.log(`Translating to ${langName} (${locale})...`);
  if (isIncrementalMode) {
    console.log("Mode: Incremental (only untranslated content)");
  } else {
    console.log("Mode: Full translation");
  }

  const enMessages = await readLocaleFile(enPath);

  if (!enMessages) {
    console.error(`Source file not found: ${enPath}`);
    process.exit(1);
  }

  let contentToTranslate: Record<string, unknown>;
  let existingTranslations: Record<string, unknown> | null = null;

  if (isIncrementalMode) {
    // Load existing translations
    existingTranslations = await readLocaleFile(targetPath);

    if (!existingTranslations) {
      console.log("No existing translation file found. Performing full translation.");
      contentToTranslate = enMessages;
    } else {
      // Extract only untranslated content
      const { content, count } = extractUntranslated(
        enMessages,
        existingTranslations
      );

      if (count === 0) {
        console.log("✓ All content is already translated!");
        return;
      }

      console.log(`Found ${count} untranslated key(s)`);
      contentToTranslate = content;
    }
  } else {
    // Full translation mode
    contentToTranslate = enMessages;
  }

  console.log("Translating content...");
  const translated = await translateContent(contentToTranslate);

  let finalResult: Record<string, unknown>;

  if (isIncrementalMode && existingTranslations) {
    // Merge new translations with existing ones
    finalResult = mergeTranslations(existingTranslations, translated);
    console.log("Merged new translations with existing content");
  } else {
    finalResult = translated;
  }

  await writeLocaleFile(targetPath, finalResult);
  console.log(`✓ Translated messages written to ${targetPath}`);
};

main().catch((error) => {
  console.error("Translation script failed:", error);
  process.exit(1);
});
