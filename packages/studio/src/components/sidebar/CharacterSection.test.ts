import { describe, expect, it } from "vitest";
import { buildCharacterGroups } from "./CharacterSection";

describe("buildCharacterGroups", () => {
  it("uses role cards grouped by major and minor before legacy character_matrix content", () => {
    const groups = buildCharacterGroups(
      {
        major: [{ tier: "major", name: "沈砚", content: "## 核心标签\n证据洁癖。" }],
        minor: [{ tier: "minor", name: "岑秀", content: "## 核心标签\n法医。" }],
      },
      "## 旧角色\n\n- **定位**: 配角\n",
    );

    expect(groups).toEqual([
      {
        key: "major",
        title: "主要角色",
        characters: [{ name: "沈砚", fields: {}, content: "## 核心标签\n证据洁癖。" }],
      },
      {
        key: "minor",
        title: "次要角色",
        characters: [{ name: "岑秀", fields: {}, content: "## 核心标签\n法医。" }],
      },
    ]);
  });

  it("falls back to legacy character_matrix fields when role cards are empty", () => {
    const groups = buildCharacterGroups(
      { major: [], minor: [] },
      "## 沈砚\n\n- **定位**: 主角\n- **标签**: 证据洁癖\n- **当前**: 回到槐阴\n",
    );

    expect(groups).toEqual([
      {
        key: "legacy",
        title: "角色",
        characters: [
          {
            name: "沈砚",
            fields: {
              定位: "主角",
              标签: "证据洁癖",
              当前: "回到槐阴",
            },
          },
        ],
      },
    ]);
  });
});
