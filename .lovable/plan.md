

# Plan: Update Back to Deals Button Behavior

## Summary
Replace the history-based navigation with `window.opener` detection: close the tab if opened via `target="_blank"`, otherwise fallback to `/portal/search-analyzer`.

## Change

### `src/pages/portal/PortalAnalyzer.tsx`

Replace the `onClick` handler of the Back button (lines 14-20) with:

```tsx
onClick={() => {
  if (window.opener) {
    window.close();
  } else {
    navigate("/portal/search-analyzer");
  }
}}
```

No other files modified.

