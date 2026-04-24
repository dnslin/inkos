# CORE SOURCE GUIDE

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| 共享 NL 入口流程 | `interaction/project-control.ts` | 输入、session 恢复、请求执行 |
| 请求/会话契约 | `interaction/intents.ts` / `interaction/session.ts` | 共享 schema 与 session shape |
| 路由自然语言意图 | `interaction/nl-router.ts` | 文本到 intent 的第一跳 |
| 构造交互工具集 | `interaction/project-tools.ts` | PipelineRunner + StateManager 绑定点 |
| 章节主编排 | `pipeline/runner.ts` | plan / compose / draft / audit / revise |
| 章节持久化与复核 | `pipeline/chapter-persistence.ts` / `pipeline/chapter-review-cycle.ts` | 写后落盘与 review loop |
| 章节状态恢复 | `pipeline/chapter-state-recovery.ts` | 结构化状态异常恢复路径 |
| 文件系统与锁 | `state/manager.ts` | book layout、snapshot、write lock |
| 配置优先级 | `utils/config-loader.ts` | global env / project env / `inkos.json` |
| 公共导出面 | `index.ts` | 任何 export 变化都可能外溢 |

## LOCAL RULES

- `interaction/` 是 CLI `interact` 与 Studio assistant 的共享内核；这里的行为不是单入口私有实现。
- `pipeline/runner.ts` 负责总编排，较小的 pipeline 文件负责 persistence、validation、review、恢复等分工。
- `state/manager.ts` 持有 on-disk layout 和 lock 语义；目录结构改动会连锁影响导入、导出、写作与恢复。
- `index.ts` 应保持克制；“只是导出一下”也可能形成稳定外部接口。
- `src/__tests__` 只覆盖 core 视角；共享入口变更仍需回头检查 CLI/Studio。

## AVOID

- 不要把旧 Markdown 真相文件默认当成所有书籍的权威源。
- 不要把已持久化的 runtime artifacts 再退化回一次性 prompt blob。
- 不要把恢复链路里的校验视为可选；脏状态会在后续章节里放大。
