# CLI PACKAGE GUIDE

## PURPOSE

`@actalk/inkos` 是 Commander 命令入口与打包壳。这里应尽量保持薄：解析参数、装配依赖、调用 core/Studio 能力，而不是重新实现领域逻辑。

## LOCAL STRUCTURE

- `src/program.ts` — 顶层命令注册与默认 `inkos` 行为
- `src/commands` — 一命令一文件
- `src/interaction-tools.ts` — CLI 到 core 交互运行时的桥接
- `src/project-bootstrap.ts` — 项目初始化布局
- `src/__tests__` — 命令层测试
- `dist/` — 发布产物，不是源码

## LOCAL CONVENTIONS

- 裸 `inkos` 默认启动 Studio；这是当前产品入口，不是临时兼容逻辑。
- `interact --json` 是给外部 agent / automation 的结构化接口。
- `tui` 仅保留迁移提示，除非产品方向改变，不要在这里恢复旧运行时。
- command 文件应以参数解析和输出整形为主；业务规则优先回到 core。
- 此包测试脚本带 `--passWithNoTests`；“没失败”不等于“已覆盖”。

## VERIFY

- `pnpm --filter @actalk/inkos build`
- `pnpm --filter @actalk/inkos test`
- `pnpm --filter @actalk/inkos typecheck`

## AVOID

- 不要在命令文件里重写 core 已有的 pipeline / interaction 逻辑。
- 不要无意中把 `tui` 又做成真实运行入口。
- 不要假设 CLI 是唯一人类入口；当前默认 UX 是 Studio。
