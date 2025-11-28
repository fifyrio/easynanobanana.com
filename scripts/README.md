# Translation Scripts

Automated translation scripts for internationalizing the Nano Banana platform.

## 📁 Files

- **`translate.ts`** - Main translation script with incremental mode support
- **`TRANSLATION_GUIDE.md`** - Detailed usage guide and examples

## 🚀 Quick Start

### 1. Setup Environment

Add your OpenRouter API key to `.env` or `.env.local`:

```env
OPENROUTER_API_KEY=your_api_key_here
```

### 2. Translate a Language

**Full translation (first time):**
```bash
npm run translate ja              # Japanese
npm run translate ko              # Korean
npm run translate es              # Spanish
```

**Incremental translation (updates only):**
```bash
npm run translate ja -- --incremental
npm run translate ko -- --incremental
```

## ✨ Features

### ✅ Incremental Translation Mode
- Only translates missing or untranslated content
- Saves 90%+ on API costs for updates
- Preserves human-edited translations
- Auto-detects placeholder patterns like `[Japanese translation]`

### ✅ Smart Deep Merge
- Recursively merges new translations with existing content
- Preserves nested object structures
- No data loss when updating translations

### ✅ Cost Optimization
- Full translation: ~$0.50 per language
- Incremental (10 keys): ~$0.01 per language
- Uses efficient GPT-4.1 Mini model

### ✅ Type Safety
- Full TypeScript support
- Validates JSON structure
- Error handling and recovery

## 📖 Usage Examples

### Example 1: First Time Translation

```bash
# Translate entire en.json to Japanese
npm run translate ja

# Output:
# Translating to Japanese (ja)...
# Mode: Full translation
# Translating content...
# ✓ Translated messages written to messages/ja.json
```

### Example 2: Adding New Keys

After adding new content to `messages/en.json`:

```bash
# Only translate the new keys
npm run translate ja -- --incremental

# Output:
# Translating to Japanese (ja)...
# Mode: Incremental (only untranslated content)
# Found 15 untranslated key(s)
# Translating content...
# Merged new translations with existing content
# ✓ Translated messages written to messages/ja.json
```

### Example 3: All Up-to-Date

```bash
npm run translate ja -- --incremental

# Output:
# Translating to Japanese (ja)...
# Mode: Incremental (only untranslated content)
# ✓ All content is already translated!
```

## 🌍 Supported Languages

| Code | Language | Code | Language |
|------|----------|------|----------|
| `es` | Spanish | `ja` | Japanese |
| `de` | German | `ko` | Korean |
| `fr` | French | `ru` | Russian |
| `it` | Italian | `ar` | Arabic |
| `pt` | Portuguese | `nl` | Dutch |
| `zh` | Simplified Chinese | `pl` | Polish |
| `zh-TW` | Traditional Chinese | `vi` | Vietnamese |
| | | `th` | Thai |

## 🔧 How It Works

### Full Translation Mode

1. Reads `messages/en.json`
2. Sends entire content to OpenRouter API
3. Writes translated JSON to `messages/{locale}.json`

### Incremental Translation Mode

1. Reads `messages/en.json` (source)
2. Reads `messages/{locale}.json` (target)
3. Compares and extracts untranslated keys:
   - Keys with `[Language translation]` placeholders
   - Missing keys in target file
4. Only translates extracted content
5. Deep merges new translations with existing content
6. Writes complete merged result

### Placeholder Detection

The script detects these patterns as "untranslated":
```json
{
  "title": "[Japanese translation] Welcome",
  "subtitle": "[Korean translation] Get started",
  "button": "[Spanish translation] Click here"
}
```

## 💡 Best Practices

### ✅ Recommended Workflow

1. **Develop in English**
   - Update `messages/en.json` with new content

2. **Use Incremental Mode**
   ```bash
   npm run translate ja -- --incremental
   npm run translate ko -- --incremental
   ```

3. **Review Translations**
   - Check quality before committing
   - Edit any incorrect translations manually

4. **Commit Changes**
   ```bash
   git add messages/
   git commit -m "i18n: Update Japanese and Korean translations"
   ```

### 🚫 Avoid

- Don't use full translation mode for small updates
- Don't skip reviewing AI-generated translations
- Don't commit without testing

## 🐛 Troubleshooting

### "Missing OPENROUTER_API_KEY"

**Solution:** Add API key to `.env.local`:
```env
OPENROUTER_API_KEY=sk-or-v1-...
```

### "Source file not found"

**Solution:** Ensure `messages/en.json` exists:
```bash
ls messages/en.json
```

### Translation quality issues

**Solution:** Switch to better model in `translate.ts`:
```typescript
// Line 85
model: "openai/gpt-4o"  // Better quality, higher cost
```

### Script hangs/timeout

**Possible causes:**
- Large file size
- Network issues
- API rate limits

**Solution:**
- Split large translations into smaller batches
- Check internet connection
- Wait and retry

## 📊 Cost Estimation

Based on OpenRouter pricing (GPT-4.1 Mini):

### Full Translation
- **~1500 keys** = ~$0.40-0.60 per language
- **All 15 languages** = ~$6-9 total

### Incremental Translation
- **10 new keys** = ~$0.01 per language
- **100 new keys** = ~$0.05 per language

💰 **Savings:** Use incremental mode to save 90%+ on updates!

## 🔐 Security Notes

- Never commit `.env` or `.env.local` files
- Keep your OpenRouter API key secret
- Review `messages/` before committing (no sensitive data)

## 📚 Additional Resources

- [TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md) - Complete usage guide
- [OpenRouter Docs](https://openrouter.ai/docs) - API documentation
- [next-intl Docs](https://next-intl-docs.vercel.app/) - i18n framework

## 🤝 Contributing

Found a bug or want to improve the script?

1. Open an issue describing the problem
2. Submit a PR with your improvements
3. Update this README if you add features

---

**Happy Translating! 🌐✨**
