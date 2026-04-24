# Agent Model Overrides UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Studio page where users configure per-agent LLM model overrides via UI.

**Architecture:** Single new page component (`ModelOverridesPage.tsx`) with inline table-row editing. Uses existing `useApi`/`putApi` hooks against the already-existing `GET/PUT /api/v1/project/model-overrides` endpoints. No new backend code, no new Zustand store — pure local `useState`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, @base-ui/react primitives, lucide-react icons, vitest

---

### Task 1: Add hash route for model-overrides page

**Files:**
- Modify: `packages/studio/src/hooks/use-hash-route.ts:3-18`

- [ ] **Step 1: Add route type**

Add `| { page: "model-overrides" }` to the `HashRoute` union type at line 17 (before `"doctor"`):

```typescript
export type HashRoute =
  | { page: "dashboard" }
  | { page: "book"; bookId: string }
  | { page: "book-create" }
  | { page: "services" }
  | { page: "service-detail"; serviceId: string }
  | { page: "chapter"; bookId: string; chapterNumber: number }
  | { page: "analytics"; bookId: string }
  | { page: "truth"; bookId: string }
  | { page: "daemon" }
  | { page: "logs" }
  | { page: "genres" }
  | { page: "style" }
  | { page: "import" }
  | { page: "radar" }
  | { page: "model-overrides" }
  | { page: "doctor" };
```

No other changes needed — `model-overrides` is an in-memory-only route (not in `HASH_PAGES`), same as `genres`, `style`, `logs`, etc.

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS (no errors in use-hash-route.ts or consumers)

- [ ] **Step 3: Commit**

```bash
git add packages/studio/src/hooks/use-hash-route.ts
git commit -m "feat(studio): add model-overrides hash route type"
```

---

### Task 2: Add i18n keys

**Files:**
- Modify: `packages/studio/src/hooks/use-i18n.ts`

- [ ] **Step 1: Add translation entries**

Insert the following block into the `strings` object in `use-i18n.ts`. Place it after the existing `// Config extras` section (after line ~206):

```typescript
  // Model Overrides page
  "nav.modelOverrides": { zh: "Agent 模型覆盖", en: "Agent Model Routing" },
  "overrides.title": { zh: "Agent 模型覆盖", en: "Agent Model Routing" },
  "overrides.description": { zh: "为不同 pipeline agent 指定独立 LLM 模型。未配置的 agent 使用默认模型。", en: "Assign different LLM models to pipeline agents. Unconfigured agents use the default model." },
  "overrides.overridden": { zh: "覆盖中", en: "Overridden" },
  "overrides.default": { zh: "默认", en: "Default" },
  "overrides.edit": { zh: "编辑", en: "Edit" },
  "overrides.collapse": { zh: "收起", en: "Collapse" },
  "overrides.removeOverride": { zh: "移除覆盖", en: "Remove Override" },
  "overrides.advanced": { zh: "高级选项", en: "Advanced" },
  "overrides.status": { zh: "状态", en: "Status" },
  "overrides.customModel": { zh: "自定义", en: "Custom" },
  "overrides.model": { zh: "模型", en: "Model" },
  "overrides.provider": { zh: "Provider", en: "Provider" },
  "overrides.baseUrl": { zh: "Base URL", en: "Base URL" },
  "overrides.apiKeyEnv": { zh: "API Key 环境变量", en: "API Key Env Var" },
  "overrides.stream": { zh: "流式输出", en: "Stream" },
  "overrides.save": { zh: "保存", en: "Save" },
  "overrides.saving": { zh: "保存中...", en: "Saving..." },
  "overrides.cancel": { zh: "取消", en: "Cancel" },
  "overrides.usingDefault": { zh: "使用默认", en: "Using default" },
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/studio/src/hooks/use-i18n.ts
git commit -m "feat(studio): add model overrides i18n keys"
```

---

### Task 3: Create ModelOverridesPage component

**Files:**
- Create: `packages/studio/src/pages/ModelOverridesPage.tsx`

This is the core of the feature. A single file containing the page component, agent metadata, and inline editing logic.

- [ ] **Step 1: Write the component**

```typescript
import { useState } from "react";
import { useApi, putApi } from "../hooks/use-api";
import type { TFunction } from "../hooks/use-i18n";

// ---------------------------------------------------------------------------
// Agent metadata (stable — maps override keys to human-readable labels)
// ---------------------------------------------------------------------------

const AGENT_META: Record<string, { label: string }> = {
  architect:             { label: "世界观/大纲构建" },
  auditor:               { label: "连续性审计" },
  "chapter-analyzer":    { label: "章节分析" },
  composer:              { label: "运行时上下文组装" },
  "fanfic-canon-importer": { label: "同人设定导入" },
  "foundation-reviewer": { label: "基础设定审查" },
  "length-normalizer":   { label: "章节长度规范化" },
  planner:               { label: "章节规划" },
  radar:                 { label: "市场雷达扫描" },
  reviser:               { label: "章节修订" },
  "state-validator":     { label: "状态校验" },
  writer:                { label: "章节草稿写作" },
};

interface AgentLLMOverride {
  model: string;
  provider?: "anthropic" | "openai" | "custom";
  baseUrl?: string;
  apiKeyEnv?: string;
  stream?: boolean;
}

type OverrideValue = string | AgentLLMOverride;
type OverridesMap = Record<string, OverrideValue>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeOverride(v: OverrideValue): AgentLLMOverride {
  if (typeof v === "string") return { model: v };
  return v;
}

function overrideDisplay(o: AgentLLMOverride): string {
  const parts = [o.model];
  if (o.provider) parts.push(`@ ${o.provider}`);
  return parts.join(" ");
}

interface Nav {
  toDashboard: () => void;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ModelOverridesPage({ nav, t }: { nav: Nav; t: TFunction }) {
  const { data, loading, refetch } = useApi<{ overrides: OverridesMap }>("/project/model-overrides");
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Draft state for the currently-editing agent
  const [draftModel, setDraftModel] = useState("");
  const [draftProvider, setDraftProvider] = useState("");
  const [draftBaseUrl, setDraftBaseUrl] = useState("");
  const [draftApiKeyEnv, setDraftApiKeyEnv] = useState("");
  const [draftStream, setDraftStream] = useState(true);

  const overrides = data?.overrides ?? {};

  const startEdit = (agent: string) => {
    const raw = overrides[agent];
    const o = raw ? normalizeOverride(raw) : { model: "", stream: true };
    setEditingAgent(agent);
    setDraftModel(o.model ?? "");
    setDraftProvider(o.provider ?? "");
    setDraftBaseUrl(o.baseUrl ?? "");
    setDraftApiKeyEnv(o.apiKeyEnv ?? "");
    setDraftStream(o.stream ?? true);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingAgent(null);
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingAgent || !draftModel.trim()) return;
    setSaving(true);
    setError(null);

    const next: OverridesMap = { ...overrides };

    const hasAdvanced = draftProvider || draftBaseUrl || draftApiKeyEnv || draftStream === false;
    if (hasAdvanced) {
      const o: AgentLLMOverride = { model: draftModel.trim() };
      if (draftProvider) o.provider = draftProvider as AgentLLMOverride["provider"];
      if (draftBaseUrl) o.baseUrl = draftBaseUrl;
      if (draftApiKeyEnv) o.apiKeyEnv = draftApiKeyEnv;
      if (!draftStream) o.stream = false;
      next[editingAgent] = o;
    } else {
      next[editingAgent] = draftModel.trim();
    }

    try {
      await putApi("/project/model-overrides", { overrides: next });
      setEditingAgent(null);
      void refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const removeOverride = async () => {
    if (!editingAgent) return;
    setSaving(true);
    setError(null);

    const next: OverridesMap = { ...overrides };
    delete next[editingAgent];

    try {
      await putApi("/project/model-overrides", { overrides: next });
      setEditingAgent(null);
      void refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const agentList = Object.keys(AGENT_META);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:px-12 lg:py-16 fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <button
          onClick={nav.toDashboard}
          className="inline-flex items-center rounded-lg border border-border/50 bg-card/60 px-3 py-1.5 font-medium text-foreground hover:bg-secondary/50 transition-colors"
        >
          {t("bread.home")}
        </button>
        <span className="text-border">/</span>
        <span className="text-foreground">{t("overrides.title")}</span>
      </div>

      <h1 className="font-serif text-2xl mb-2">{t("overrides.title")}</h1>
      <p className="text-muted-foreground text-sm mb-8">{t("overrides.description")}</p>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border/30 p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_3fr_1.5fr_1fr] bg-muted/60 text-xs uppercase tracking-wider font-medium text-muted-foreground">
            <div className="px-5 py-3">Agent</div>
            <div className="px-5 py-3">{t("overrides.model")}</div>
            <div className="px-5 py-3">{t("overrides.status")}</div>
            <div className="px-5 py-3" />
          </div>

          {agentList.map((agent) => {
            const raw = overrides[agent];
            const o = raw ? normalizeOverride(raw) : null;
            const isOverridden = o !== null;
            const isEditing = editingAgent === agent;
            const meta = AGENT_META[agent];

            return (
              <div key={agent} className={isOverridden ? "bg-primary/[0.03]" : ""}>
                {/* Info row */}
                <div className="grid grid-cols-[2fr_3fr_1.5fr_1fr] border-t border-border items-center">
                  <div className="px-5 py-3.5">
                    <div className="font-medium text-sm">{agent}</div>
                    <div className="text-xs text-muted-foreground">{meta.label}</div>
                  </div>
                  <div className="px-5 py-3.5">
                    <span className={`font-mono text-xs ${isOverridden ? "text-primary" : "text-muted-foreground"}`}>
                      {isOverridden ? overrideDisplay(o) : t("overrides.usingDefault")}
                    </span>
                  </div>
                  <div className="px-5 py-3.5">
                    <span
                      className={
                        isOverridden
                          ? "inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
                          : "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
                      }
                    >
                      {isOverridden ? t("overrides.overridden") : t("overrides.default")}
                    </span>
                  </div>
                  <div className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => (isEditing ? cancelEdit() : startEdit(agent))}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isEditing ? t("overrides.collapse") : t("overrides.edit")}
                    </button>
                  </div>
                </div>

                {/* Edit panel */}
                {isEditing && (
                  <div className="border-t border-border px-5 py-4 bg-muted/20">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Model */}
                      <div>
                        <label className="block text-xs font-medium mb-1.5">
                          {t("overrides.model")}
                        </label>
                        <div className="flex gap-2">
                          <input
                            value={draftModel}
                            onChange={(e) => setDraftModel(e.target.value)}
                            placeholder="claude-sonnet-4-20250514"
                            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Provider */}
                      <div>
                        <label className="block text-xs font-medium mb-1.5">
                          {t("overrides.provider")}
                        </label>
                        <select
                          value={draftProvider}
                          onChange={(e) => setDraftProvider(e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-muted-foreground"
                        >
                          <option value="">{t("overrides.usingDefault")}</option>
                          <option value="anthropic">anthropic</option>
                          <option value="openai">openai</option>
                          <option value="custom">custom</option>
                        </select>
                      </div>
                    </div>

                    {/* Advanced */}
                    <details className="mt-4 group">
                      <summary className="cursor-pointer text-xs font-medium text-primary hover:opacity-80 transition-opacity">
                        {t("overrides.advanced")}
                      </summary>
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                        <div>
                          <label className="block text-xs font-medium mb-1.5">
                            {t("overrides.baseUrl")}
                          </label>
                          <input
                            value={draftBaseUrl}
                            onChange={(e) => setDraftBaseUrl(e.target.value)}
                            placeholder="https://api.anthropic.com"
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5">
                            {t("overrides.apiKeyEnv")}
                          </label>
                          <input
                            value={draftApiKeyEnv}
                            onChange={(e) => setDraftApiKeyEnv(e.target.value)}
                            placeholder="WRITER_API_KEY"
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={draftStream}
                              onChange={(e) => setDraftStream(e.target.checked)}
                              className="rounded border-border"
                            />
                            {t("overrides.stream")}
                          </label>
                        </div>
                      </div>
                    </details>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                      <button
                        onClick={saveEdit}
                        disabled={saving || !draftModel.trim()}
                        className="inline-flex items-center rounded-lg bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-40"
                      >
                        {saving ? t("overrides.saving") : t("overrides.save")}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
                      >
                        {t("overrides.cancel")}
                      </button>
                      {isOverridden && (
                        <button
                          onClick={removeOverride}
                          disabled={saving}
                          className="ml-auto rounded-lg border border-destructive/40 px-4 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                        >
                          {t("overrides.removeOverride")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/studio/src/pages/ModelOverridesPage.tsx
git commit -m "feat(studio): add ModelOverridesPage component"
```

---

### Task 4: Wire page into App.tsx

**Files:**
- Modify: `packages/studio/src/App.tsx`

- [ ] **Step 1: Import ModelOverridesPage**

At line 17 (after the `import { DoctorView }` line), add:

```typescript
import { ModelOverridesPage } from "./pages/ModelOverridesPage";
```

- [ ] **Step 2: Add nav callback**

In the `nav` object (around line 77, before `toDoctor`), add:

```typescript
toModelOverrides: () => setRoute({ page: "model-overrides" }),
```

- [ ] **Step 3: Add route rendering**

In the main content area (after the `radar` block at line ~238, before the `doctor` block), add:

```typescript
{route.page === "model-overrides" && (
  <div className="max-w-4xl mx-auto px-6 py-12 md:px-12 lg:py-16 fade-in">
    <ModelOverridesPage nav={nav} t={t} />
  </div>
)}
```

Note: Since the page component already has its own `max-w-4xl mx-auto px-6 py-12` wrapper, adjust the outer div to just pass-through without doubling padding. Use:

```typescript
{route.page === "model-overrides" && (
  <ModelOverridesPage nav={nav} t={t} />
)}
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/studio/src/App.tsx
git commit -m "feat(studio): wire ModelOverridesPage into App routes"
```

---

### Task 5: Add sidebar navigation item

**Files:**
- Modify: `packages/studio/src/components/Sidebar.tsx`

- [ ] **Step 1: Add Route icon import**

At line 23 (in the lucide-react import block), add `Route` to the import:

Change:
```typescript
import {
  Settings,
  Terminal,
  Plus,
  ScrollText,
  Boxes,
  Wand2,
  FileInput,
  TrendingUp,
  Stethoscope,
  FolderOpen,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
```

To include `Route`:
```typescript
import {
  Settings,
  Terminal,
  Plus,
  ScrollText,
  Boxes,
  Wand2,
  FileInput,
  TrendingUp,
  Stethoscope,
  FolderOpen,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Route,
} from "lucide-react";
```

- [ ] **Step 2: Add toModelOverrides to Nav interface**

At line 59 (before `toDoctor`), add:

```typescript
toModelOverrides: () => void;
```

- [ ] **Step 3: Add sidebar item**

In the "系统" section (after the logs SidebarItem at line ~335, before the closing `</div>` of the system section), add:

```typescript
<SidebarItem
  label={t("nav.modelOverrides")}
  icon={<Route size={16} />}
  active={activePage === "model-overrides"}
  onClick={nav.toModelOverrides}
/>
```

- [ ] **Step 4: Update activePage computation**

The `activePage` variable in App.tsx (line 82-87) needs to map `"model-overrides"` to a value that matches Sidebar's comparison. But since Sidebar's `activePage` prop is derived from `route.page`, and `model-overrides` doesn't match `"services"` or `"service-detail"`, it should just pass through. Check the current logic:

```typescript
const activePage =
  activeBookId
    ? `book:${activeBookId}`
    : route.page === "service-detail"
      ? "services"
      : route.page;
```

The `model-overrides` page passes through unchanged as `"model-overrides"`. The Sidebar compares `activePage === "model-overrides"` — this works correctly.

- [ ] **Step 5: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/studio/src/components/Sidebar.tsx
git commit -m "feat(studio): add model overrides nav item to sidebar"
```

---

### Task 6: Run full typecheck + build verification

- [ ] **Step 1: Run full typecheck**

```bash
pnpm typecheck
```
Expected: PASS

- [ ] **Step 2: Run Studio build**

```bash
pnpm --filter @actalk/inkos-studio build
```
Expected: Build succeeds without errors

- [ ] **Step 3: Run all tests**

```bash
pnpm --filter @actalk/inkos-studio test
```
Expected: All existing tests pass

- [ ] **Step 4: Commit (if any fixups needed)**

If no issues: no commit needed. The feature is complete.

---

### Summary of Changes

| File | Action |
|------|--------|
| `packages/studio/src/hooks/use-hash-route.ts` | Add `"model-overrides"` route variant |
| `packages/studio/src/hooks/use-i18n.ts` | Add 17 translation keys |
| `packages/studio/src/pages/ModelOverridesPage.tsx` | **NEW** — page component |
| `packages/studio/src/App.tsx` | Import + nav + route render |
| `packages/studio/src/components/Sidebar.tsx` | Nav item + Route icon |
