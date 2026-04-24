# STUDIO SOURCE GUIDE

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| API 路由与 SSE 行为 | `api/server.ts` | 主 Hono app、事件流、配置与模型发现 |
| API 进程启动 | `api/index.ts` | root/port 解析，缺失前端产物时自动 build |
| React 入口 | `main.tsx` | 客户端 bootstrap |
| 顶层应用组合 | `App.tsx` | 页面与布局根节点 |
| 聊天/会话状态 | `store/chat` | message parts、stream events、selectors |
| 服务配置状态 | `store/service` | service source、model 选择、连接态 |
| 可复用 UI primitives | `components/ui` | shared controls |
| 聊天与工具执行展示 | `components/chat` + `components/ai-elements` | assistant message、tool steps、prompt input |

## LOCAL RULES

- `api/server.ts` 很大但目前是刻意集中；抽文件前先确认边界确实稳定，而不是为了拆而拆。
- SSE event names 是前端契约；改名必须同步 store 与 UI 消费方。
- 跨面板共享行为优先进 Zustand store/selectors，而不是散落在组件局部 state。
- 前端测试按 `src/**/*.test.ts` 就地放置；API 测试留在 `src/api`。
- 保持 server-only 代码不进入客户端导入链；`tsconfig.server.json` 是构建边界。

## VERIFY

- `pnpm --filter @actalk/inkos-studio build`
- `pnpm --filter @actalk/inkos-studio test`
- `pnpm --filter @actalk/inkos-studio typecheck`

## AVOID

- 不要让 API 路由直接消费未校验的文件系统路径。
- 不要假设模型/服务配置只来自 `.env`；Studio 同时支持 env 与 Studio-managed source。
- 不要改 stream/tool event payload 却不检查 chat store 的消费者。
