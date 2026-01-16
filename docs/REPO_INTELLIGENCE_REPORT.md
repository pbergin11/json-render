# Repo Intelligence Report

## 1) Executive summary (10 bullets max)

- json-render is a monorepo with a core schema/catalog package, a React renderer package, a docs/playground app, and an example dashboard app. Evidence: README project structure shows `packages/core`, `packages/react`, `apps/web`, and `examples/dashboard`.【F:README.md†L196-L207】
- The core package defines a catalog-driven UI schema (UIElement, UITree, JSON patch ops) and generates Zod validators for elements and trees. Evidence: core types and createCatalog schema/validation. 【F:packages/core/src/types.ts†L49-L139】【F:packages/core/src/catalog.ts†L141-L221】
- LLM generation is wired through Next.js API routes that call `streamText` with Anthropic Claude and custom system prompts. Evidence: example dashboard and web API routes. 【F:examples/dashboard/app/api/generate/route.ts†L1-L26】【F:apps/web/app/api/generate/route.ts†L1-L95】
- Structured outputs are JSONL patch lines parsed on the client and applied incrementally to a flat UITree. Evidence: JSONL rules in prompts and `useUIStream` patch parsing. 【F:apps/web/app/api/generate/route.ts†L43-L78】【F:packages/react/src/hooks.ts†L8-L201】
- React rendering is driven by a component registry; the renderer walks the tree by key and renders children recursively with visibility gating. Evidence: Renderer and visibility hooks. 【F:packages/react/src/renderer.tsx†L55-L133】【F:packages/react/src/contexts/visibility.tsx†L16-L85】
- The example dashboard demonstrates the end-to-end flow: prompt → API stream → useUIStream → Renderer with a registry. Evidence: example dashboard page and component registry. 【F:examples/dashboard/app/page.tsx†L71-L226】【F:examples/dashboard/components/ui/index.ts†L1-L55】
- Data binding relies on JSON Pointer paths and `getByPath`/`setByPath`, used by components like Metric. Evidence: core path helpers and Metric component. 【F:packages/core/src/types.ts†L160-L214】【F:examples/dashboard/components/ui/metric.tsx†L1-L40】
- Actions, validation, and visibility are implemented in core and React contexts, but enforcement is mostly opt-in and not in the streaming pipeline by default. Evidence: actions/validation/visibility contexts exist, useUIStream applies patches directly. 【F:packages/core/src/actions.ts†L31-L219】【F:packages/core/src/validation.ts†L7-L279】【F:packages/react/src/hooks.ts†L126-L201】
- Prompting strategies are inconsistent: example apps hardcode prompts while docs emphasize `generateCatalogPrompt`, which only lists components/actions/visibility/validation. Evidence: system prompts vs catalog prompt generator. 【F:apps/web/app/api/generate/route.ts†L5-L78】【F:examples/dashboard/app/api/generate/route.ts†L1-L26】【F:packages/core/src/catalog.ts†L225-L287】
- Documentation examples diverge from implementation (hook API names and patch paths), which risks integration errors. Evidence: docs show `endpoint/generate/abort` and `/root/children`, while hook uses `api/send/clear` and patches use `/elements`. 【F:apps/web/app/docs/streaming/page.tsx†L20-L40】【F:apps/web/app/docs/ai-sdk/page.tsx†L53-L76】【F:packages/react/src/hooks.ts†L83-L219】

## 2) Architecture map

### a) Main flows

1. User prompt → Next.js API route → `streamText` with system prompt → JSONL patch stream. Evidence: API route usage. 【F:examples/dashboard/app/api/generate/route.ts†L8-L26】【F:apps/web/app/api/generate/route.ts†L82-L95】
2. Client `useUIStream` reads stream → parses JSONL patches → applies to UITree. Evidence: parse/apply logic. 【F:packages/react/src/hooks.ts†L8-L201】
3. `Renderer` reads UITree → renders via registry with visibility/action contexts. Evidence: Renderer and visibility hooks. 【F:packages/react/src/renderer.tsx†L55-L133】【F:packages/react/src/contexts/visibility.tsx†L16-L85】

### b) Key modules

- `packages/core/src/catalog.ts`: Catalog creation, schema generation, prompt generation. 【F:packages/core/src/catalog.ts†L113-L287】
- `packages/core/src/types.ts`: UI data structures and path resolution. 【F:packages/core/src/types.ts†L3-L214】
- `packages/react/src/hooks.ts`: Streaming patch parser and UITree updates. 【F:packages/react/src/hooks.ts†L8-L219】
- `packages/react/src/renderer.tsx`: Registry-based React rendering. 【F:packages/react/src/renderer.tsx†L15-L232】
- `examples/dashboard/app/api/generate/route.ts`: Example LLM endpoint. 【F:examples/dashboard/app/api/generate/route.ts†L1-L26】
- `examples/dashboard/app/page.tsx`: Example end-to-end UI. 【F:examples/dashboard/app/page.tsx†L71-L266】

### c) Key data structures

- `UIElement`: key, type, props, optional children/visibility. 【F:packages/core/src/types.ts†L49-L68】
- `UITree`: flat map of elements plus root key. 【F:packages/core/src/types.ts†L94-L101】
- `JsonPatch`: patch operations used for streaming updates. 【F:packages/core/src/types.ts†L127-L139】

### ASCII diagram

```
User prompt
   |
   v
Next.js API route (streamText + system prompt)
   |
   v
JSONL patch stream
   |
   v
useUIStream -> UITree (patch apply)
   |
   v
Renderer -> registry components (visibility/actions/data)
```

Evidence: API routes, useUIStream, Renderer. 【F:examples/dashboard/app/api/generate/route.ts†L8-L26】【F:packages/react/src/hooks.ts†L8-L201】【F:packages/react/src/renderer.tsx†L55-L133】

## 3) Structured output pipeline deep dive

### Schema definition locations, examples, and validation path

- Core schema lives in `packages/core/src/types.ts` (UIElement, UITree, JsonPatch). 【F:packages/core/src/types.ts†L49-L139】
- Catalog validation derives Zod schemas for all component types and exposes validateElement/validateTree. 【F:packages/core/src/catalog.ts†L141-L221】
- Visibility, actions, and validation schemas live in `packages/core/src/visibility.ts`, `actions.ts`, and `validation.ts`. 【F:packages/core/src/visibility.ts†L17-L53】【F:packages/core/src/actions.ts†L47-L84】【F:packages/core/src/validation.ts†L30-L46】

### How repair/retries work

- No retry or repair loop exists in the client streaming pipeline; a single fetch is made and errors are surfaced. 【F:packages/react/src/hooks.ts†L126-L201】

### Exact point where JSON becomes React

- JSONL patches are parsed and applied to `UITree` in `useUIStream`. 【F:packages/react/src/hooks.ts†L8-L201】
- `Renderer` uses the UITree to render components via registry. 【F:packages/react/src/renderer.tsx†L115-L133】

## 4) Prompt dossier

### Prompt templates and usage

- Example dashboard system prompt (hardcoded in API route) with JSONL rules and component list. 【F:examples/dashboard/app/api/generate/route.ts†L1-L26】
- Docs/playground system prompt (hardcoded) with JSONL rules and UI constraints. 【F:apps/web/app/api/generate/route.ts†L5-L78】
- `generateCatalogPrompt` for component/action/visibility/validation descriptions. 【F:packages/core/src/catalog.ts†L225-L287】
- Docs examples using `generateCatalogPrompt` in AI SDK and quick start. 【F:apps/web/app/docs/ai-sdk/page.tsx†L19-L47】【F:apps/web/app/docs/quick-start/page.tsx†L94-L112】

### Differences and risks

- Hardcoded prompts can drift from Zod schema in catalog. Evidence: prompts vs catalog definitions. 【F:apps/web/app/api/generate/route.ts†L5-L78】【F:packages/core/src/catalog.ts†L141-L221】
- `generateCatalogPrompt` does not include JSONL format or examples, despite docs implying it does. 【F:apps/web/app/docs/ai-sdk/page.tsx†L78-L88】【F:packages/core/src/catalog.ts†L225-L287】

## 5) React generation dossier

### Component generation approach

- Flat UITree with children as key references. 【F:packages/core/src/types.ts†L62-L101】
- Recursive rendering with registry lookup and visibility checks. 【F:packages/react/src/renderer.tsx†L71-L109】

### Constraints and sanitization

- Visibility conditions evaluated at render time via data/auth context. 【F:packages/react/src/contexts/visibility.tsx†L38-L85】
- No built-in sanitization in renderer; responsibility shifts to component implementation. 【F:packages/react/src/renderer.tsx†L105-L109】

### Composition patterns and limitations

- Children lists are string keys only; no nested JSON elements. 【F:packages/core/src/types.ts†L62-L68】
- Actions run via `ActionProvider` and can show confirmation dialogs. 【F:packages/react/src/contexts/actions.tsx†L71-L193】【F:packages/react/src/renderer.tsx†L171-L217】
- Validation is opt-in via `ValidationProvider` and `useFieldValidation`. 【F:packages/react/src/contexts/validation.tsx†L62-L230】

## 6) Failure modes (top 20)

1. Invalid JSONL lines are dropped silently; missing UI updates. Evidence: parsePatchLine returns null on parse failure. 【F:packages/react/src/hooks.ts†L8-L19】
2. Patch paths outside `/root` or `/elements/` are ignored. 【F:packages/react/src/hooks.ts†L28-L63】
3. Element property patches are ignored if element does not exist. 【F:packages/react/src/hooks.ts†L49-L60】
4. Unknown component types warn and render nothing. 【F:packages/react/src/renderer.tsx†L79-L85】
5. Missing child elements result in partial trees. 【F:packages/react/src/renderer.tsx†L87-L93】
6. No schema validation before render; malformed props can reach components. 【F:packages/react/src/hooks.ts†L126-L201】【F:packages/core/src/catalog.ts†L207-L221】
7. Catalog validation mode is stored but not enforced in rendering. 【F:packages/core/src/catalog.ts†L129-L194】
8. Action with no handler logs a warning and does nothing. 【F:packages/react/src/contexts/actions.tsx†L90-L98】
9. Unknown validation functions are treated as valid. 【F:packages/core/src/validation.ts†L220-L231】
10. Validation uses dot-joined paths, not JSON Pointer. 【F:packages/react/src/contexts/validation.tsx†L84-L92】
11. Client sends `currentTree` but server route may ignore it. 【F:packages/react/src/hooks.ts†L139-L150】【F:apps/web/app/api/generate/route.ts†L82-L90】
12. Prompt truncation can remove critical user detail. 【F:apps/web/app/api/generate/route.ts†L80-L86】
13. `hasChildren` is not enforced at runtime. 【F:packages/core/src/catalog.ts†L16-L24】
14. Prompts drift from catalog schema definitions. 【F:apps/web/app/api/generate/route.ts†L5-L78】【F:packages/core/src/catalog.ts†L141-L221】
15. Docs show patch paths that do not match streaming implementation. 【F:apps/web/app/docs/streaming/page.tsx†L20-L22】【F:packages/react/src/hooks.ts†L28-L63】
16. Docs show hook APIs that do not match implementation. 【F:apps/web/app/docs/ai-sdk/page.tsx†L53-L76】【F:packages/react/src/hooks.ts†L83-L219】
17. No prompt-injection guardrails beyond system prompt text. 【F:examples/dashboard/app/api/generate/route.ts†L8-L26】
18. No retry/backoff on streaming failures. 【F:packages/react/src/hooks.ts†L191-L201】
19. Confirmation dialog only rendered when using JSONUIProvider. 【F:packages/react/src/renderer.tsx†L171-L217】
20. Action schema does not enforce catalog action names. 【F:packages/core/src/actions.ts†L75-L84】

## 7) Recommendations (10 prioritized)

1. Enforce catalog validation in `useUIStream` or Renderer before render. 【F:packages/core/src/catalog.ts†L207-L221】【F:packages/react/src/hooks.ts†L126-L201】
2. Expand `generateCatalogPrompt` to include JSONL output rules and examples, or centralize prompts around catalog. 【F:packages/core/src/catalog.ts†L225-L287】
3. Align docs with real hook API and patch format, or add compatibility aliases. 【F:apps/web/app/docs/streaming/page.tsx†L20-L40】【F:packages/react/src/hooks.ts†L83-L219】
4. Add patch validation and error surfacing in `useUIStream`. 【F:packages/react/src/hooks.ts†L8-L77】
5. Enforce `hasChildren` and catalog action names at validation time. 【F:packages/core/src/catalog.ts†L16-L24】【F:packages/core/src/actions.ts†L75-L84】
6. Add retry/repair loop for partial or invalid streaming outputs. 【F:packages/react/src/hooks.ts†L126-L201】
7. Standardize validation paths on JSON Pointer. 【F:packages/react/src/contexts/validation.tsx†L84-L92】【F:packages/core/src/types.ts†L160-L185】
8. Add server-side guardrails (schema validation and prompt sanitization). 【F:apps/web/app/api/generate/route.ts†L80-L91】
9. Add tests for patch parsing, path handling, and renderer coverage. 【F:packages/react/src/hooks.ts†L8-L201】
10. Add structured logging hooks for patch apply and action execution. 【F:packages/react/src/contexts/actions.tsx†L90-L98】【F:packages/react/src/hooks.ts†L173-L182】

## 8) Appendices

### Glossary

- Catalog: Component/action/function definitions with schemas and validation mode. 【F:packages/core/src/catalog.ts†L27-L111】
- UIElement: Flat element structure with key/type/props/children/visible. 【F:packages/core/src/types.ts†L49-L68】
- UITree: Flat element map with root key. 【F:packages/core/src/types.ts†L94-L101】
- JsonPatch: Streaming patch operation type. 【F:packages/core/src/types.ts†L127-L139】
- VisibilityCondition: Boolean/path/auth/logic visibility expression. 【F:packages/core/src/types.ts†L70-L92】
- Action: Named action with params and callbacks. 【F:packages/core/src/actions.ts†L31-L45】
- ValidationConfig: Validation checks and triggers. 【F:packages/core/src/validation.ts†L18-L46】

### Index of important files (top 30)

1. README.md — Project overview and structure. 【F:README.md†L196-L227】
2. pnpm-workspace.yaml — Workspace packages. 【F:pnpm-workspace.yaml†L1-L4】
3. package.json — Root scripts and tooling. 【F:package.json†L13-L34】
4. packages/core/src/catalog.ts — Catalog creation and prompt generation. 【F:packages/core/src/catalog.ts†L113-L287】
5. packages/core/src/types.ts — Core data types and path helpers. 【F:packages/core/src/types.ts†L3-L214】
6. packages/core/src/visibility.ts — Visibility schemas and evaluation. 【F:packages/core/src/visibility.ts†L17-L217】
7. packages/core/src/actions.ts — Action schema and execution logic. 【F:packages/core/src/actions.ts†L31-L219】
8. packages/core/src/validation.ts — Validation schemas and runtime logic. 【F:packages/core/src/validation.ts†L7-L279】
9. packages/react/src/hooks.ts — Streaming patch parser and UITree updates. 【F:packages/react/src/hooks.ts†L8-L219】
10. packages/react/src/renderer.tsx — Registry-based React renderer. 【F:packages/react/src/renderer.tsx†L15-L232】
11. packages/react/src/contexts/data.tsx — Data model context. 【F:packages/react/src/contexts/data.tsx†L18-L134】
12. packages/react/src/contexts/actions.tsx — Action execution and confirm dialog. 【F:packages/react/src/contexts/actions.tsx†L21-L320】
13. packages/react/src/contexts/visibility.tsx — Visibility evaluation context. 【F:packages/react/src/contexts/visibility.tsx†L16-L85】
14. packages/react/src/contexts/validation.tsx — Validation context and hooks. 【F:packages/react/src/contexts/validation.tsx†L19-L230】
15. examples/dashboard/lib/catalog.ts — Example dashboard catalog. 【F:examples/dashboard/lib/catalog.ts†L1-L196】
16. examples/dashboard/app/api/generate/route.ts — Example LLM route. 【F:examples/dashboard/app/api/generate/route.ts†L1-L26】
17. examples/dashboard/app/page.tsx — Example end-to-end UI. 【F:examples/dashboard/app/page.tsx†L71-L266】
18. examples/dashboard/components/ui/index.ts — Example component registry. 【F:examples/dashboard/components/ui/index.ts†L1-L55】
19. examples/dashboard/components/ui/metric.tsx — Example data binding via paths. 【F:examples/dashboard/components/ui/metric.tsx†L1-L40】
20. apps/web/app/api/generate/route.ts — Docs/playground LLM route. 【F:apps/web/app/api/generate/route.ts†L1-L95】
21. apps/web/app/docs/ai-sdk/page.tsx — AI SDK docs and prompt usage. 【F:apps/web/app/docs/ai-sdk/page.tsx†L19-L103】
22. apps/web/app/docs/quick-start/page.tsx — Quick start integration docs. 【F:apps/web/app/docs/quick-start/page.tsx†L17-L160】
23. apps/web/app/docs/streaming/page.tsx — Streaming docs and JSONL examples. 【F:apps/web/app/docs/streaming/page.tsx†L15-L130】
24. apps/web/app/docs/catalog/page.tsx — Catalog docs and prompt usage. 【F:apps/web/app/docs/catalog/page.tsx†L35-L105】
25. packages/core/src/catalog.test.ts — Catalog tests and prompt checks. 【F:packages/core/src/catalog.test.ts†L1-L198】

### Open questions

- API key configuration is not in repo; the runtime path for credentials should be confirmed. Evidence: API routes call `streamText` without explicit credentials. 【F:examples/dashboard/app/api/generate/route.ts†L8-L26】【F:apps/web/app/api/generate/route.ts†L82-L95】
- Current Tree usage is shown in docs but not wired in the production route; confirm desired server-side state handling. 【F:apps/web/app/docs/ai-sdk/page.tsx†L19-L47】【F:packages/react/src/hooks.ts†L139-L150】
