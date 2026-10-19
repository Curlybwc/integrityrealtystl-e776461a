# AGENTS.md

- Email Schedules uses the shared scheduler domain type and a local client schema extension when generated types omit its table; this preserves the managed client and existing query behavior.

## graphify

This repo carries a Graphify knowledge graph in `graphify-out/` (graph.json, GRAPH_REPORT.md, graph.html), generated from the codebase — the TypeScript/React source plus the Supabase edge functions and migrations — and committed so every builder (Codex, Lovable, or a successor tool) works from the same map.

- `graphify query "<question>"` — traverse the graph for a structural question
- `graphify affected "<node>"` — what a change impacts; run this before merging a batch
- `graphify explain "<node>"` — a node and its neighbors
- `graphify god-nodes` — the most connected hubs

Regenerate after significant changes with `graphify update .` (install: `pip install graphifyy` plus the `graphifyy[sql]` extra) and commit the refreshed graphify-out/ outputs: graph.json, GRAPH_REPORT.md, graph.html, manifest.json, .graphify_labels.json. The graph is a derived view — the canonical blueprints and PRDs (Module 07 — Connected Product — Integrity Realty STL, in the Drive corpus) remain the source of truth; if they disagree, the documents win and the graph gets rebuilt.
