

## Confirmed: All Variables in Scope

- `arv_effective` — line 174
- `list_price` — line 176
- `rehab_est_effective` — lines 181–187
- All declared before the flip logic at line 196. No risk of compile error.

## Hardening Applied

The Flip input `onChange` will use:
```tsx
onChange={(e) => {
  const val = parseFloat(e.target.value);
  if (!isNaN(val)) {
    updateConfig("flip_max_arv_pct", val / 100);
  }
}}
```

This prevents clearing the field from setting `flip_max_arv_pct` to 0 and wiping all flip matches.

## Plan Status

Ready to implement. No blockers identified:

1. `screening.ts`: Add `flip_max_arv_pct` to config type/defaults, replace flip logic with MAO calculation
2. `PortalSearchAnalyzer.tsx`: Replace disclaimer, remove rehab section, add Flip column with hardened input, update grid to 3-col, update header text

