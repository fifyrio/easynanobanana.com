# AI Makeup — Design Document

**Date:** 2026-04-24
**Status:** Approved
**Template Source:** ai-hairstyle / ai-age-filter / beard-filter

## Overview

Create a new `/ai-image-effects/ai-makeup` page. Users upload a photo, select a makeup style preset (including no-makeup/bare face), and receive an AI-generated image. Results displayed with Before/After comparison slider.

## Makeup Presets (10)

| # | Name | Description |
|---|------|-------------|
| 1 | Natural | Light, everyday natural makeup |
| 2 | Glam | Full glamorous makeup |
| 3 | Smokey Eye | Dark smokey eye shadow look |
| 4 | Korean Glass Skin | Dewy, luminous Korean-style makeup |
| 5 | Bridal | Elegant wedding makeup |
| 6 | Gothic | Dark, dramatic gothic makeup |
| 7 | No Makeup | Remove all makeup, bare face |
| 8 | Contour & Highlight | Sculpted contour with highlight |
| 9 | Sunset Eye | Warm orange/pink eye shadow |
| 10 | Red Carpet | Celebrity red carpet glam |

## Architecture

Same pattern as ai-age-filter and beard-filter. Single dimension presets, no Custom tab, 5 credits, shared API routes.
