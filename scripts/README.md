# Translation Script

This directory contains the automated translation script for MangoNote AI.

## Setup

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

The script requires the following packages (already added to `package.json`):
- `dotenv` - For loading environment variables
- `openai` - OpenAI SDK for API calls
- `tsx` - TypeScript execution engine

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_SITE_URL=https://mangonote.app  # Optional
OPENROUTER_SITE_NAME=MangoNote AI          # Optional
```

You can get an API key from [OpenRouter](https://openrouter.ai/).

## Usage

### Translate to a Specific Language

```bash
npm run translate <locale>
```

**Examples:**
```bash
npm run translate es        # Spanish
npm run translate de        # German
npm run translate fr        # French
npm run translate ja        # Japanese
npm run translate zh-TW     # Traditional Chinese
```

### Incremental Translation (Only Missing Keys)

If you only want to translate missing or untranslated content:

```bash
npm run translate <locale> -- --incremental
```

**Example:**
```bash
npm run translate es -- --incremental
```

This will:
- Load the existing translation file
- Compare with the English source
- Only translate missing keys
- Merge new translations with existing content

### Translate All Languages

To translate all supported languages at once:

```bash
npm run translate:all
```

⚠️ **Note**: This will take several minutes and consume API credits.

## Supported Languages

The script supports the following languages:

| Code    | Language               |
|---------|------------------------|
| `es`    | Spanish                |
| `de`    | German                 |
| `fr`    | French                 |
| `it`    | Italian                |
| `pt`    | Portuguese             |
| `zh`    | Simplified Chinese     |
| `zh-TW` | Traditional Chinese    |
| `ja`    | Japanese               |
| `ko`    | Korean                 |
| `ru`    | Russian                |
| `vi`    | Vietnamese             |
| `th`    | Thai                   |

## How It Works

1. **Source File**: The script reads from `messages/en.json` (English)
2. **Translation**: Uses OpenRouter API with GPT-4.1-mini model
3. **Output**: Writes translated JSON to `messages/<locale>.json`
4. **Structure**: Maintains the exact JSON structure, keys, and placeholders

### Features

- ✅ Preserves JSON structure
- ✅ Maintains placeholder variables (e.g., `{count}`, `{name}`)
- ✅ Keeps nested objects and arrays intact
- ✅ Incremental mode to only translate missing content
- ✅ Automatic merging with existing translations

## Troubleshooting

### Error: Missing OPENROUTER_API_KEY

Make sure you've added `OPENROUTER_API_KEY` to your `.env.local` file.

### Translation Quality Issues

The script uses GPT-4.1-mini for cost-effective translations. For better quality:
1. Review and manually adjust translations as needed
2. Use the incremental mode to fix specific keys
3. Consider using a more powerful model in `translate.ts` (line 89)

## Best Practices

1. **Always translate from English**: English (`en.json`) is the source of truth
2. **Review translations**: Automated translations may need manual review
3. **Use incremental mode**: When adding new keys, use `--incremental` to avoid re-translating everything
4. **Version control**: Commit translation files to track changes
5. **Test thoroughly**: Check the UI with different languages to ensure everything displays correctly

## Examples

### Adding a New Key

1. Add the new key to `messages/en.json`:
   ```json
   {
     "newFeature": {
       "title": "New Feature",
       "description": "This is a new feature"
     }
   }
   ```

2. Run incremental translation for all languages:
   ```bash
   npm run translate es -- --incremental
   npm run translate de -- --incremental
   # ... repeat for other languages
   ```
