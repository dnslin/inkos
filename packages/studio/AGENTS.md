# STUDIO PACKAGE GUIDE

## PURPOSE

`@actalk/inkos-studio` 是本地 Web 工作台打包包，内部同时包含 Hono API/server 与 React/Vite 前端。把它视为“混合 client/server 包”，不要按纯 SPA 理解。

## LOCAL STRUCTURE

- `src/api` — Hono 服务、SSE、配置/密钥、CLI parity 路由
- `src` 其余目录 — React 应用、状态存储、页面与组件
- `vitest.config.ts` — 前端测试匹配 `src/**/*.test.ts`
- `tsconfig.server.json` — 仅构建 `src/api`，并排除 API 测试
- `dist/api/index.js` — 发布后的包主入口
- `dist/` — 前端静态产物与服务端 bundle

## LOCAL CONVENTIONS

- `pnpm --filter @actalk/inkos-studio dev` 会启动两个进程：API 在 `4569`，Vite 在 `4567`。
- 构建后是单进程分发：`src/api/index.ts` 启 Hono 服务并托管 `dist/` 前端。
- Studio 应优先复用 core 的 config/model/secrets 能力，而不是各自复制 provider 逻辑。
- API 路由需要显式做 book/genre/session 等标识符安全校验。
- 前端测试与服务端测试分布不同；`tsconfig.server.json` 排除测试文件是有意设计。

## VERIFY

- `pnpm --filter @actalk/inkos-studio build`
- `pnpm --filter @actalk/inkos-studio test`
- `pnpm --filter @actalk/inkos-studio typecheck`

## AVOID

- 不要把这个包当作纯客户端；它的 `main` 指向服务端 bundle。
- 不要放松 API handler 的输入/路径校验。
- 不要在 core 已有 preset/caching 的地方再硬编码模型发现逻辑。
