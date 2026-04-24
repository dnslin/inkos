# Agent Model Overrides UI

**Date:** 2026-04-24
**Status:** designed

## Summary

Add a "Agent Model Overrides" page to Studio so users can configure per-agent LLM models via UI instead of manually editing `inkos.json`. The backend API (`GET/PUT /api/v1/project/model-overrides`) and pipeline resolution (`PipelineRunner.resolveOverride`) already exist — this is purely a frontend addition.

## Routes

- Add `{ page: "model-overrides" }` to `HashRoute` union in `use-hash-route.ts`
- Add `toModelOverrides: () => setRoute({ page: "model-overrides" })` to nav in `App.tsx`
- Render `<ModelOverridesPage>` in `App.tsx` main content area

## Navigation

- Add sidebar item under "系统" section, below "模型配置", with `Route` icon (lucide-react)
- Label: "Agent 模型覆盖" (zh) / "Agent Model Routing" (en)

## Page Layout

```
max-w-4xl mx-auto px-6 py-12 fade-in
├── Breadcrumb (首页 / Agent 模型覆盖)
├── Title (font-serif text-2xl) + description
└── Table card (rounded-xl border overflow-hidden)
    ├── Header row (grid-cols-4: Agent | Model | Status | Actions)
    └── AgentRow × 12 (architect, auditor, chapter-analyzer, composer,
        fanfic-canon-importer, foundation-reviewer, length-normalizer,
        planner, radar, reviser, state-validator, writer)
        ├── Info row (click toggles edit panel)
        ├── Badge: "覆盖中" (primary badge) or "默认" (muted badge)
        └── EditPanel (accordion, max 1 open)
            ├── Model selector (dropdown + custom input)
            ├── Provider input (auto-inferred, overrideable)
            ├── <details> advanced:
            │   ├── Base URL
            │   ├── API Key env var name
            │   └── Stream checkbox
            └── Actions: Save / Cancel / Remove Override
```

## Data Flow

- **Load:** `useApi<{ overrides: Record<string, string | AgentLLMOverride> }>("/project/model-overrides")`
- **Save:** `putApi("/project/model-overrides", { overrides: fullOverrides })` — full replace
- **Model list:** derive from existing `GET /api/v1/services` (connected services → their models) or reuse ServiceDetailPage probe pattern
- **State:** local `useState` for `editingAgent`, `draftOverride`, `saving` — no Zustand store

## Agent Metadata (hardcoded in UI)

Each agent row displays:
- **name** — the override key used in `resolveOverride()`
- **label** — Chinese description

```typescript
const AGENT_META: Record<string, { label: string }> = {
  architect:            { label: "世界观/大纲构建" },
  auditor:              { label: "连续性审计" },
  "chapter-analyzer":   { label: "章节分析" },
  composer:             { label: "运行时上下文组装" },
  "fanfic-canon-importer": { label: "同人设定导入" },
  "foundation-reviewer": { label: "基础设定审查" },
  "length-normalizer":  { label: "章节长度规范化" },
  planner:              { label: "章节规划" },
  radar:                { label: "市场雷达扫描" },
  reviser:              { label: "章节修订" },
  "state-validator":    { label: "状态校验" },
  writer:               { label: "章节草稿写作" },
};
```

## Override Format

Supports both string (model name only) and full `AgentLLMOverride` object:
```json
{
  "modelOverrides": {
    "writer": "claude-sonnet-4-20250514",
    "auditor": {
      "model": "gpt-5.4",
      "provider": "openai",
      "baseUrl": "https://api.openai.com/v1",
      "apiKeyEnv": "AUDITOR_API_KEY",
      "stream": true
    }
  }
}
```

## i18n Keys to Add

```typescript
"nav.modelOverrides": { zh: "Agent 模型覆盖", en: "Agent Model Routing" },
"overrides.title": { zh: "Agent 模型覆盖", en: "Agent Model Routing" },
"overrides.description": { zh: "为不同 pipeline agent 指定独立 LLM 模型。未配置的 agent 使用默认模型。", en: "Assign different LLM models to pipeline agents. Unconfigured agents use the default model." },
"overrides.overridden": { zh: "覆盖中", en: "Overridden" },
"overrides.default": { zh: "默认", en: "Default" },
"overrides.edit": { zh: "编辑", en: "Edit" },
"overrides.collapse": { zh: "收起", en: "Collapse" },
"overrides.remove": { zh: "移除覆盖", en: "Remove Override" },
"overrides.advanced": { zh: "高级选项", en: "Advanced" },
"overrides.customModel": { zh: "自定义", en: "Custom" },
```

## Files Changed

| File | Change |
|------|--------|
| `packages/studio/src/hooks/use-hash-route.ts` | Add `"model-overrides"` route |
| `packages/studio/src/App.tsx` | Add nav entry + page rendering + import |
| `packages/studio/src/components/Sidebar.tsx` | Add nav item under 系统 section |
| `packages/studio/src/hooks/use-i18n.ts` | Add translation keys |
| `packages/studio/src/pages/ModelOverridesPage.tsx` | **NEW** — main page component |

## Out of Scope

- Per-book model overrides (global only for now)
- Real-time model availability checking in the dropdown
- PI-agent session model override (PI-agent uses its own model selection flow)
