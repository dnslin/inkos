# CORE PACKAGE GUIDE

## PURPOSE

`@actalk/inkos-core` 是共享运行时。凡是看起来像“产品真实行为”的逻辑，默认先判断是否应该放在这里，而不是 CLI 或 Studio。

## LOCAL STRUCTURE

- `src/index.ts` — 公开导出面
- `src/interaction` — 共享自然语言路由、会话、工具运行时
- `src/pipeline` — 写作/审计/修订编排与章节持久化辅助
- `src/state` — 书籍/项目文件系统、结构化状态、memory DB
- `src/agents` — 面向模型的 agent 与 prompt 组织
- `src/models` — schema 与类型契约
- `genres/` — 随包发布的内建 genre profiles
- `dist/` — emitted JS/types，不是源码

## LOCAL CONVENTIONS

- 业务规则优先放 core；CLI 与 Studio 主要负责输入/输出适配。
- `src/index.ts` 是 load-bearing 的公共边界；新增或改动 export 要当成跨包接口变化。
- `src/interaction` 的修改通常会同时影响 `packages/cli/src/commands/interact.ts` 与 `packages/studio/src/api/server.ts`。
- 运行时真相越来越以 `story/state/*.json` 为准；Markdown 经常只是 projection 或兼容层。
- `story/runtime/` 下的 `intent/context/rule-stack/trace` 是持久化工件，不是临时 prompt 拼接物。
- 大纲/真相文件存在新旧布局兼容；删 fallback path 前先确认当前书籍到底以哪套文件为准。

## VERIFY

- `pnpm --filter @actalk/inkos-core build`
- `pnpm --filter @actalk/inkos-core test`
- `pnpm --filter @actalk/inkos-core typecheck`

## AVOID

- 不要只改 Markdown projection 却不检查结构化状态读写链路。
- 不要在没确认 `inputGovernanceMode`（`v2` / `legacy`）前判断写作行为是否回归。
- 不要绕过 deduplicate 或 validation 去恢复/应用 runtime state。
- 不要把共享行为改动当成 core 私有改动；下游入口往往同样受影响。
