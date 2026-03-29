import { Command } from "commander";
import { PipelineRunner, StateManager } from "@actalk/inkos-core";
import { findProjectRoot, log, logError, resolveBookId } from "../utils.js";

export const branchCommand = new Command("branch")
  .description("Inspect and control interactive fiction branches");

branchCommand
  .command("tree")
  .description("Show the interactive branch tree")
  .argument("[book-id]", "Book ID (auto-detected if only one book)")
  .option("--json", "Output JSON")
  .action(async (bookIdArg: string | undefined, opts) => {
    try {
      const root = findProjectRoot();
      const state = new StateManager(root);
      const bookId = await resolveBookId(bookIdArg, root);
      const tree = await loadInteractiveTreeOrThrow(state, bookId);

      if (opts.json) {
        log(JSON.stringify(tree, null, 2));
        return;
      }

      log(`Interactive Branch Tree: ${bookId}`);
      for (const node of tree.nodes) {
        const marker = node.nodeId === tree.activeNodeId ? "*" : "-";
        log(`${marker} ${node.nodeId} [${node.status}] ${node.branchLabel} (${node.displayPath})`);
      }
    } catch (error) {
      if (opts.json) {
        log(JSON.stringify({ error: String(error) }));
      } else {
        logError(`Failed to show branch tree: ${error}`);
      }
      process.exit(1);
    }
  });

branchCommand
  .command("choices")
  .description("Show pending choices on the active branch")
  .argument("[book-id]", "Book ID (auto-detected if only one book)")
  .option("--json", "Output JSON")
  .action(async (bookIdArg: string | undefined, opts) => {
    try {
      const root = findProjectRoot();
      const state = new StateManager(root);
      const bookId = await resolveBookId(bookIdArg, root);
      const tree = await loadInteractiveTreeOrThrow(state, bookId);
      const activeNode = tree.nodes.find((node) => node.nodeId === tree.activeNodeId);
      if (!activeNode) {
        throw new Error(`Interactive branch tree is missing active node "${tree.activeNodeId}".`);
      }

      const result = {
        bookId,
        activeNodeId: activeNode.nodeId,
        activeNodeStatus: activeNode.status,
        choices: tree.choices.filter((choice) => choice.fromNodeId === activeNode.nodeId),
      };

      if (opts.json) {
        log(JSON.stringify(result, null, 2));
        return;
      }

      log(`Active Branch: ${activeNode.nodeId} [${activeNode.status}]`);
      if (result.choices.length === 0) {
        log("No pending choices.");
        return;
      }
      for (const choice of result.choices) {
        log(`- ${choice.choiceId}: ${choice.label} -> ${choice.toNodeId}`);
      }
    } catch (error) {
      if (opts.json) {
        log(JSON.stringify({ error: String(error) }));
      } else {
        logError(`Failed to show branch choices: ${error}`);
      }
      process.exit(1);
    }
  });

branchCommand
  .command("choose")
  .description("Choose one pending branch option")
  .argument("<args...>", "Book ID (optional) and choice ID")
  .option("--json", "Output JSON")
  .action(async (args: ReadonlyArray<string>, opts) => {
    try {
      const root = findProjectRoot();
      const { bookId, targetId: choiceId } = await resolveInteractiveTargetArgs(args, root, "choice");
      const pipeline = createLocalBranchPipeline(root);
      const result = await pipeline.chooseInteractiveBranch(bookId, choiceId);

      if (opts.json) {
        log(JSON.stringify(result, null, 2));
        return;
      }

      log(`Selected ${choiceId}. Active branch is now ${result.activeNodeId}.`);
    } catch (error) {
      if (opts.json) {
        log(JSON.stringify({ error: String(error) }));
      } else {
        logError(`Failed to choose branch: ${error}`);
      }
      process.exit(1);
    }
  });

branchCommand
  .command("switch")
  .description("Switch to an existing branch node")
  .argument("<args...>", "Book ID (optional) and node ID")
  .option("--json", "Output JSON")
  .action(async (args: ReadonlyArray<string>, opts) => {
    try {
      const root = findProjectRoot();
      const { bookId, targetId: nodeId } = await resolveInteractiveTargetArgs(args, root, "node");
      const pipeline = createLocalBranchPipeline(root);
      const result = await pipeline.switchInteractiveBranch(bookId, nodeId);

      if (opts.json) {
        log(JSON.stringify(result, null, 2));
        return;
      }

      log(`Switched active branch to ${result.activeNodeId} (snapshot ${result.restoredChapter}).`);
    } catch (error) {
      if (opts.json) {
        log(JSON.stringify({ error: String(error) }));
      } else {
        logError(`Failed to switch branch: ${error}`);
      }
      process.exit(1);
    }
  });

async function loadInteractiveTreeOrThrow(state: StateManager, bookId: string) {
  const book = await state.loadBookConfig(bookId);
  if (book.narrativeMode !== "interactive-tree") {
    throw new Error(`Book "${bookId}" is not an interactive-tree book.`);
  }

  const tree = await state.loadBranchTree(bookId);
  if (!tree) {
    throw new Error(`Interactive branch tree is missing for "${bookId}".`);
  }

  return tree;
}

async function resolveInteractiveTargetArgs(
  args: ReadonlyArray<string>,
  root: string,
  targetLabel: "choice" | "node",
): Promise<{ bookId: string; targetId: string }> {
  if (args.length === 1) {
    return {
      bookId: await resolveBookId(undefined, root),
      targetId: args[0]!,
    };
  }

  if (args.length === 2) {
    return {
      bookId: await resolveBookId(args[0], root),
      targetId: args[1]!,
    };
  }

  throw new Error(`Usage: inkos branch ${targetLabel === "choice" ? "choose" : "switch"} [book-id] <${targetLabel}-id>`);
}

function createLocalBranchPipeline(root: string): PipelineRunner {
  return new PipelineRunner({
    client: {
      provider: "openai",
      apiFormat: "chat",
      stream: false,
      defaults: {
        temperature: 0,
        maxTokens: 1,
        thinkingBudget: 0,
        maxTokensCap: null,
        extra: {},
      },
    } as ConstructorParameters<typeof PipelineRunner>[0]["client"],
    model: "noop-model",
    projectRoot: root,
  });
}
