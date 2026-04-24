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
        <div role="table" className="rounded-xl border border-border overflow-hidden">
          {/* Table header */}
          <div role="row" className="grid grid-cols-[2fr_3fr_1.5fr_1fr] bg-muted/60 text-xs uppercase tracking-wider font-medium text-muted-foreground">
            <div role="columnheader" className="px-5 py-3">Agent</div>
            <div role="columnheader" className="px-5 py-3">{t("overrides.model")}</div>
            <div role="columnheader" className="px-5 py-3">{t("overrides.status")}</div>
            <div role="columnheader" className="px-5 py-3" />
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
                <div role="row" className="grid grid-cols-[2fr_3fr_1.5fr_1fr] border-t border-border items-center">
                  <div role="cell" className="px-5 py-3.5">
                    <div className="font-medium text-sm">{agent}</div>
                    <div className="text-xs text-muted-foreground">{meta.label}</div>
                  </div>
                  <div role="cell" className="px-5 py-3.5">
                    <span className={`font-mono text-xs ${isOverridden ? "text-primary" : "text-muted-foreground"}`}>
                      {isOverridden ? overrideDisplay(o) : t("overrides.usingDefault")}
                    </span>
                  </div>
                  <div role="cell" className="px-5 py-3.5">
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
                  <div role="cell" className="px-5 py-3.5 text-right">
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
                        <label htmlFor={`${agent}-model`} className="block text-xs font-medium mb-1.5">
                          {t("overrides.model")}
                        </label>
                        <div className="flex gap-2">
                          <input
                            id={`${agent}-model`}
                            value={draftModel}
                            onChange={(e) => setDraftModel(e.target.value)}
                            placeholder="claude-sonnet-4-20250514"
                            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Provider */}
                      <div>
                        <label htmlFor={`${agent}-provider`} className="block text-xs font-medium mb-1.5">
                          {t("overrides.provider")}
                        </label>
                        <select
                          id={`${agent}-provider`}
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
                          <label htmlFor={`${agent}-baseUrl`} className="block text-xs font-medium mb-1.5">
                            {t("overrides.baseUrl")}
                          </label>
                          <input
                            id={`${agent}-baseUrl`}
                            value={draftBaseUrl}
                            onChange={(e) => setDraftBaseUrl(e.target.value)}
                            placeholder="https://api.anthropic.com"
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor={`${agent}-apiKeyEnv`} className="block text-xs font-medium mb-1.5">
                            {t("overrides.apiKeyEnv")}
                          </label>
                          <input
                            id={`${agent}-apiKeyEnv`}
                            value={draftApiKeyEnv}
                            onChange={(e) => setDraftApiKeyEnv(e.target.value)}
                            placeholder="WRITER_API_KEY"
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor={`${agent}-stream`} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              id={`${agent}-stream`}
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
