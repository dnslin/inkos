# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-24T08:48:38+08:00
**Commit:** 899cda0

## OVERVIEW

InkOS 是一个 `pnpm` workspace，分成共享领域引擎（`packages/core`）、Commander CLI（`packages/cli`）和本地 Web 工作台（`packages/studio`）。
真正的产品行为大多落在 `packages/core`，CLI 与 Studio 主要是不同的人机入口与适配层。

## STRUCTURE

- `packages/core` — 领域模型、写作流水线、状态持久化、共享交互内核
- `packages/cli` — `inkos` 命令面、Studio 启动入口、结构化 `interact`、迁移期 `tui`
- `packages/studio` — Hono API 与 React/Vite 前端共包
- `scripts` — 发布前包清单改写与 `workspace:*` 校验脚本
- `skills` — OpenClaw skill 元数据，不是主产品运行时代码
- `test-project` — 独立示例项目，带 `inkos.json` 运行配置，不属于 workspace 包
- `packages/*/dist` — 构建产物；除非在查 emitted output，否则优先看 `src`

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| 理解共享引擎公开面 | `packages/core/src/index.ts` | 导出面决定跨包可见能力 |
| 追踪章节主编排 | `packages/core/src/pipeline/runner.ts` | `write/draft/audit/revise` 主路径 |
| 追踪自然语言交互流 | `packages/core/src/interaction/project-control.ts` | CLI `interact` 与 Studio 共用 |
| 查看项目/书籍持久化布局 | `packages/core/src/state/manager.ts` | on-disk layout 与 lock 的源头 |
| 排查配置优先级 | `packages/core/src/utils/config-loader.ts` | `~/.inkos/.env`、项目 `.env`、`inkos.json` |
| 查看 CLI 入口面 | `packages/cli/src/program.ts` | 裸 `inkos` 默认启动 Studio |
| 查看项目初始化布局 | `packages/cli/src/project-bootstrap.ts` | 生成 `inkos.json`、`.env`、`books/`、`radar/` |
| 查看 Studio API 接线 | `packages/studio/src/api/server.ts` | Hono 路由、SSE、配置/模型发现 |
| 查看 Studio 客户端入口 | `packages/studio/src/main.tsx` | React bootstrap |

## CONVENTIONS

- 根命令统一走 `pnpm`；workspace 级脚本大多通过 `pnpm -r` 扇出。
- 本地运行时固定在 Node 22；虽然 `engines` 允许 `>=20`，但仓库文件与文档都按较新的 Node 组织。
- 根 `lint` 脚本存在，但各包没有稳定的 `lint` 子脚本；内建可依赖的校验是 `pnpm typecheck` 与 `pnpm test`。
- 发布不是单纯 `pnpm pack`：`prepack`/`postpack` 会改写包清单，`verify-no-workspace-protocol.mjs` 负责检查 `workspace:*` 没被带进发布包。
- 仓库没有 monorepo TS path aliases 或 project references；每个包维护自己的 TS 边界。

## ANTI-PATTERNS (THIS PROJECT)

- 不要编辑 `dist/` 代替 `src/`。
- 不要把 `inkos tui` 当成交互式运行时；它只打印迁移提示。
- 不要把 `pnpm lint` 当作可靠的全仓验收门。
- 不要把 API keys 写进 `inkos.json`；仓库设计是 env/secrets 流。
- 改共享交互或流水线时，不要只跑 core 测试；CLI 和 Studio 都会受影响。
- 不要忽略 `test-project/inkos.json` 这种非 workspace 运行配置文件；它常用于真实集成场景。

## COMMANDS

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm test`
- `pnpm typecheck`
- `pnpm release`
- `pnpm --filter @actalk/inkos-core test`
- `pnpm --filter @actalk/inkos test`
- `pnpm --filter @actalk/inkos-studio test`
