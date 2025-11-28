# Translation Guide

This guide explains how to use the improved translation script to translate your i18n JSON files.

## 📋 Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your `.env` file with OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_api_key_here
   OPENROUTER_SITE_URL=https://easynanobanana.com  # Optional
   OPENROUTER_SITE_NAME=Nano Banana                # Optional
   ```

## 🚀 Usage

### Full Translation Mode

Translate the entire `messages/en.json` file to a target language:

```bash
npm run translate ja              # Translate to Japanese
npm run translate ko              # Translate to Korean
npm run translate es              # Translate to Spanish
```

**When to use:**
- First time translating a new language
- Want to completely regenerate all translations

---

### Incremental Translation Mode ⭐ (Recommended)

Only translate missing or untranslated content:

```bash
npm run translate ja -- --incremental   # Only translate untranslated Japanese
npm run translate ko -- --incremental   # Only translate untranslated Korean
```

**When to use:**
- You added new keys to `messages/en.json`
- Some translations have `[Japanese translation]` placeholders
- Want to preserve existing human-edited translations

**How it works:**
1. Compares `messages/en.json` with `messages/ja.json`
2. Finds keys with placeholder patterns like `[Japanese translation]`
3. Only translates those missing keys
4. Merges new translations with existing content
5. Saves the complete file

---

## 📖 Examples

### Example 1: Translating a New Language

```bash
# First time translating to Japanese
npm run translate ja

# Output:
# Translating to Japanese (ja)...
# Mode: Full translation
# Translating content...
# ✓ Translated messages written to messages/ja.json
```

### Example 2: Adding New Content

You added new keys to `en.json`:

```json
// messages/en.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

Run incremental translation:

```bash
npm run translate ja -- --incremental

# Output:
# Translating to Japanese (ja)...
# Mode: Incremental (only untranslated content)
# Found 2 untranslated key(s)
# Translating content...
# Merged new translations with existing content
# ✓ Translated messages written to messages/ja.json
```

### Example 3: All Content Already Translated

```bash
npm run translate ja -- --incremental

# Output:
# Translating to Japanese (ja)...
# Mode: Incremental (only untranslated content)
# ✓ All content is already translated!
```

---

## 🌍 Supported Languages

The script supports these locales:

- `es` - Spanish
- `de` - German
- `fr` - French
- `it` - Italian
- `pt` - Portuguese
- `zh` - Simplified Chinese
- `zh-TW` - Traditional Chinese
- `ja` - Japanese
- `ko` - Korean
- `ru` - Russian
- `ar` - Arabic
- `nl` - Dutch
- `pl` - Polish
- `vi` - Vietnamese
- `th` - Thai

---

## 🔧 Advanced Features

### Placeholder Detection

The script automatically detects untranslated content using patterns like:

- `[Japanese translation]`
- `[Korean translation]`
- `[Spanish translation]`

### Deep Merge

Incremental mode uses deep merge to preserve nested translations:

```json
// Before (existing ja.json)
{
  "common": {
    "title": "タイトル",
    "subtitle": "[Japanese translation] Subtitle"
  }
}

// After incremental translation
{
  "common": {
    "title": "タイトル",              // ✓ Preserved
    "subtitle": "サブタイトル"         // ✓ Translated
  }
}
```

---

## 💡 Tips

1. **Use incremental mode by default** - Faster and cheaper
2. **Review translations** - AI translations may need human review
3. **Keep backups** - The script overwrites files
4. **Check API costs** - Monitor your OpenRouter usage

---

## 🐛 Troubleshooting

### Error: "Missing OPENROUTER_API_KEY"

Add your API key to `.env`:
```env
OPENROUTER_API_KEY=your_key_here
```

### Error: "Source file not found"

Make sure `messages/en.json` exists and is valid JSON.

### Translation quality issues

The script uses `openai/gpt-4.1-mini` model. For better quality:
- Edit `scripts/translate.ts`
- Change the model to `openai/gpt-4o` (line 82)
- Note: Higher quality = higher cost

---

## 📝 Workflow Recommendation

1. **Develop in English** - Update `messages/en.json`
2. **Incremental translate** - Run for each language:
   ```bash
   npm run translate ja -- --incremental
   npm run translate ko -- --incremental
   npm run translate es -- --incremental
   ```
3. **Review & commit** - Check translations and commit changes
4. **Repeat** - Next time you add content, use incremental mode again

---

## 🎯 Cost Optimization

Using incremental mode can save **90%+ on API costs** for updates!

**Full translation:**
- Translates ~1500 keys = ~1500 API calls
- Cost: ~$0.50 per language

**Incremental translation (10 new keys):**
- Translates 10 keys = 10 API calls
- Cost: ~$0.01 per language

---

## 🤝 Contributing

Found an issue or want to improve the script? Check `scripts/translate.ts` and submit a PR!
