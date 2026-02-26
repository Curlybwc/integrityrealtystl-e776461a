

# Plan: Analyze Link Opens in New Tab + Back to Deals Button

## Overview
Three targeted UI changes: replace `Link` with `<a target="_blank">` using `URLSearchParams` and `Button asChild`, and add a "Back to Deals" button on the analyzer page.

## Changes

### 1. `src/components/portal/ListingCard.tsx`

- **Line 1**: Remove `Link` import from `react-router-dom` (no longer used)
- **Lines 113-122**: Replace `<Link>` block with `URLSearchParams` + `Button asChild`:

```tsx
<Button asChild variant="outline" size="sm" className="w-full h-7 text-xs">
  <a
    href={`/portal/analyzer?${new URLSearchParams({
      address: l.address ?? "",
      zip: l.zip ?? "",
      beds: String(l.beds ?? ""),
      baths: String(l.baths ?? ""),
      sqft: String(l.sqft ?? ""),
      price: String(l.list_price ?? ""),
    }).toString()}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    <ExternalLink className="h-3 w-3 mr-1" />
    Analyze
  </a>
</Button>
```

### 2. `src/components/portal/BatchAnalysisTable.tsx`

- **Line 2**: Remove `Link` import from `react-router-dom`
- **Lines 281-290**: Same replacement in table view:

```tsx
<TableCell>
  <Button asChild variant="ghost" size="sm" className="h-7 px-2">
    <a
      href={`/portal/analyzer?${new URLSearchParams({
        address: l.address ?? "",
        zip: l.zip ?? "",
        beds: String(l.beds ?? ""),
        baths: String(l.baths ?? ""),
        sqft: String(l.sqft ?? ""),
        price: String(l.list_price ?? ""),
      }).toString()}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <ExternalLink className="h-3 w-3 mr-1" />
      Analyze
    </a>
  </Button>
</TableCell>
```

### 3. `src/pages/portal/PortalAnalyzer.tsx`

- Add `useNavigate` import
- Add "Back to Deals" button with history-length guard above the header:

```tsx
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();

<button
  onClick={() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/portal/search-analyzer");
    }
  }}
  className="mb-4 text-sm font-medium text-primary hover:underline"
>
  ← Back to Deals
</button>
```

## Files NOT modified
- Routing, screening logic, edge functions, DealAnalyzer component, database schema

