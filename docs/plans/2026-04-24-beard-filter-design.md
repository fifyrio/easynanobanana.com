# Beard Filter — Design Document

**Date:** 2026-04-24
**Status:** Approved
**Template Source:** ai-hairstyle / ai-age-filter

## Overview

Create a new `/ai-image-effects/beard-filter` page by migrating the ai-hairstyle template. Users upload a photo, select a beard style preset (including clean shaven), and receive an AI-generated image with the selected facial hair. Results displayed with Before/After comparison slider.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Preset dimensions | Single dimension (beard style) | Same pattern as age-filter |
| Number of presets | 10 | Comprehensive beard style coverage |
| Custom tab | No | Presets sufficient |
| Reference images | Yes (displaySrc + referenceSrc) | Same as hairstyle |
| Credits per generation | 5 | Consistent pricing |

## Beard Presets

| # | Name | Description |
|---|------|-------------|
| 1 | Clean Shaven | Remove all facial hair |
| 2 | Stubble | Short 2-3 day growth |
| 3 | Goatee | Chin beard only |
| 4 | Full Beard | Full thick beard |
| 5 | Van Dyke | Goatee + mustache combo, clean cheeks |
| 6 | Mutton Chops | Wide sideburns, clean chin |
| 7 | Handlebar Mustache | Curled-up mustache |
| 8 | Soul Patch | Small patch below lower lip |
| 9 | Circle Beard | Mustache + goatee connected in circle |
| 10 | Balbo | Chin beard + mustache, disconnected |

## Files Created

| File | Purpose |
|------|---------|
| `src/app/[locale]/ai-image-effects/beard-filter/page.tsx` | Server page with SEO metadata |
| `src/components/AiBeardFilterExperience.tsx` | Main client component |
| `src/data/ai-beard-filter-presets.json` | 10 beard presets |
| `messages/*.json` → `aiBeardFilter` | 14 language translations |

## Files Reused (No Changes)

Same shared infrastructure as ai-hairstyle and ai-age-filter.

## Data Flow

Same as ai-age-filter: Upload → Select preset → Generate → Poll → Display Before/After.
