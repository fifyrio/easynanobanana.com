# Virtual Jewelry Try-On: Upload + History Task UI

This document summarizes how the upload flow and the history task module are implemented for the Virtual Jewelry Try-On page, with example code to reuse.

## Upload Flow Summary

- The upload UI lives in `src/components/VirtualJewelryTryOnExperience.tsx`.
- Users select an image via a hidden file input (`accept="image/*"`).
- The selected image is read locally for preview, then optionally cropped before being stored in state.
- The chosen file is uploaded to R2 via `/api/upload-image`, and the returned URL is stored in `uploadedImageUrl`.
- Upload state is cleared by a "remove" button that resets all upload-related state.

### Example (Upload Block)

```tsx
<div className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-5 shadow-inner">
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-sm font-semibold text-slate-900">Upload image</p>
      <p className="text-xs text-slate-500">.png, .jpeg, .webp up to 12MB</p>
    </div>
    <label
      htmlFor="jewelry-upload"
      className="cursor-pointer rounded-full bg-[#FFD84D] px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:-translate-y-0.5 hover:bg-[#ffe062] transition"
    >
      Upload
    </label>
    <input
      type="file"
      accept="image/*"
      id="jewelry-upload"
      className="hidden"
      onChange={handleFileChange}
    />
  </div>
  {uploadedImage ? (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#F5C04B] bg-white/80 p-3">
      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#FFE7A1] flex-shrink-0">
        <Image src={uploadedImage} alt="Uploaded photo" fill sizes="64px" className="object-cover" unoptimized />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{uploadedFileName}</p>
        <p className="text-xs text-green-600">Ready</p>
      </div>
      <button
        type="button"
        onClick={() => {
          setUploadedImage(null);
          setUploadedFile(null);
          setUploadedFileName(null);
          setUploadedImageUrl(null);
        }}
        className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 border border-red-200 text-red-500"
        aria-label="Remove image"
      >
        ✕
      </button>
    </div>
  ) : (
    <div className="mt-4 rounded-2xl border border-dashed border-[#F5C04B]/70 px-3 py-2 text-sm text-slate-500">
      Drop a clear photo to start
    </div>
  )}
</div>
```

## History Task Module Summary

- The "history task" UI is represented by `RecentTaskCard` from `src/components/ui/RecentTaskCard`.
- It appears in the right column when a generation has started (`taskStartTime`) and is either in progress or completed.
- The card shows timestamp, prompt, status, progress, and a preview image if available.
- When no active task is present, the UI falls back to the before/after comparison slider.

### Example (Recent Task Card)

```tsx
{taskStartTime && (isGenerating || generatedImage) ? (
  <RecentTaskCard
    timestamp={taskStartTime}
    prompt={currentPrompt}
    status={isGenerating ? 'generating' : 'completed'}
    progress={0}
    imageUrl={generatedImage || undefined}
    downloadFilename="jewelry-try-on.png"
    onViewFull={generatedImage ? () => setShowPreviewModal(true) : undefined}
  />
) : (
  <ComparisonSlider ... />
)}
```

## Related Files

- `src/components/VirtualJewelryTryOnExperience.tsx`
- `src/components/ui/RecentTaskCard.tsx`

