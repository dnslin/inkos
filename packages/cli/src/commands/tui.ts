import { Command } from "commander";

export function createTuiCommand(): Command {
  return new Command("tui")
    .description("Show the InkOS TUI migration notice")
    .action(() => {
      process.stdout.write(
        "The InkOS TUI is being retired.\n" +
        "For interactive work, run 'inkos' or 'inkos studio'.\n" +
        "For agents and automation, run 'inkos interact --json' or use the atomic commands.\n",
      );
    });
}
