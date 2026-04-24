# CLI SOURCE GUIDE

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| 默认命令行为 | `program.ts` | 裸 `inkos` -> Studio |
| 结构化自然语言接口 | `commands/interact.ts` | `--json` 输出契约 |
| 明确启动 Studio | `commands/studio.ts` | Web workbench 入口 |
| 退休 TUI 提示 | `commands/tui.ts` | 只保留迁移说明 |
| 初始化项目布局 | `project-bootstrap.ts` | 生成 `inkos.json`、`.env`、`books/`、`radar/` |
| 构造 CLI 交互工具 | `interaction-tools.ts` | 与 core runtime 的接线点 |
| CLI 文案与辅助 | `localization.ts` / `progress-text.ts` | 用户可见文本 |

## LOCAL RULES

- `commands/` 下的文件应该是薄入口，分支尽量少。
- 只要牵涉 interaction/session 语义，先去看 core `interaction/`，不要直接在 CLI 侧补丁。
- 只要牵涉 write/audit/revise 行为，先去看 core `pipeline/`。
- 把 Commander wiring 留在 `program.ts`；避免命令模块顶层出现隐藏副作用。

## VERIFY

- `pnpm --filter @actalk/inkos build`
- `pnpm --filter @actalk/inkos test`
- `pnpm --filter @actalk/inkos typecheck`

## AVOID

- 不要因为 CLI 最先拿到参数，就把产品逻辑留在这里。
- 不要在多个命令文件里重复 Studio 默认端口或启动策略。
- 不要让测试继续依赖早已退休的 TUI 语义。
