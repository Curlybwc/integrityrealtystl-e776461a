

# Search Results: Card View + Photo Modal

## Overview
Add a toggle to the Search & Analyze results so you can switch between the existing **table view** and a new **card grid view** that shows listing photos front and center. Both views will also support a photo lightbox for browsing all available images.

## What You'll See

### Card Grid View (new)
- Each listing displayed as a "trading card" with:
  - Main photo taking up the top portion (or a placeholder if no photos)
  - Strategy badge (Both / Turnkey / BRRRR / None) overlaid on the photo
  - Address, city, ZIP below the photo
  - Price, beds/baths/sqft, estimated rent, ARV
  - Color-coded RTP% and All-In% metrics
  - "Analyze" button linking to the Deal Analyzer
  - Click the photo to open a lightbox showing all available photos
- Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop
- Non-passing deals shown with reduced opacity (same as table view)

### Table View (enhanced)
- Existing table stays as-is
- New camera icon added to each row showing the photo count (e.g., camera icon with "6")
- Clicking it opens the same photo lightbox/modal

### Toggle
- A simple toggle button group (Grid / Table icons) at the top of the results area
- User's choice persists during the session

## Technical Details

### Files to Create
- `src/components/portal/ListingCard.tsx` -- Individual trading card component for a single analyzed listing. Shows photo, stats, strategy badge, and Analyze link.
- `src/components/portal/ListingPhotoModal.tsx` -- Dialog/modal that displays all photos for a listing in a carousel or grid. Uses existing Dialog and AspectRatio components.

### Files to Modify
- `src/components/portal/BatchAnalysisTable.tsx` -- Add the view toggle (grid vs table), render the card grid when in grid mode, add camera icon to table rows that opens the photo modal.

### No backend changes needed
Photos are already returned from the API (`photo_urls` array, up to 10 per listing). This is purely a frontend display change.

