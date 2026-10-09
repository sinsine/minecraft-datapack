# Reference index

Read only the rows that match the task. Each file is written to be read once and
kept out of the way afterwards; loading all of them wastes context and does not
make the output more correct.

| File | Read it when | Size |
|---|---|---|
| [structure.md](structure.md) | Always, before writing any file. Where every file goes, what it may be called, what `pack.mcmeta` must contain, and the full list of registry directories. | medium |
| [functions.md](functions.md) | Whenever the pack has a `.mcfunction`. Line rules, comments, macros, the `execute` grammar, `data`, `scoreboard`, selectors, NBT paths, text components. | large |
| [registries.md](registries.md) | Whenever the pack writes JSON: recipe, advancement, loot table, predicate, item modifier, damage type, tags. | medium |
| [version-gates.md](version-gates.md) | After the target version is fixed, and before using any feature you are not certain existed then. | medium |
| [pitfalls.md](pitfalls.md) | Before the pre-flight check. It is a list of mistakes that produce a pack which loads and then does nothing. | medium |
| [data/versions.json](data/versions.json) | To look up the pack format number for the target version. Machine-readable; search it, do not read it whole. | data |
| [data/commands.json](data/commands.json) | To check that a command exists, and which release added it. Argument *shapes* for `execute`, `data` and `scoreboard` are enforced in code, and documented in functions.md — the JSON holds only the command list plus the enum values the checks compare against. | data |
| [data/registries.json](data/registries.json) | To check a registry directory name, or the required keys of a registry file. | data |

## The three lookups you will actually need

```powershell
# 1. the pack format number for a Minecraft version
node -e "const v=require('./reference/data/versions.json'); console.log(v.versionToFormat['1.21.8'])"

# 2. which release added a command ({} means "present since 1.13 and unchanged")
node -e "const c=require('./reference/data/commands.json'); console.log(c.commands['place'])"

# 3. is this directory a real registry
node -e "const r=require('./reference/data/registries.json'); console.log(Object.keys(r.topLevel).join(' '))"
```

Run them from the skill directory, or replace the path with the absolute one.
These are reads of local JSON, not tests: they cost one cheap command instead of
a guess that shows up as a broken pack later.

## If the reference does not answer the question

Say so, and either avoid the feature or ask. Do not reconstruct a syntax rule
from memory: the version-gated differences in this game are numerous enough that
a confident-sounding guess is the single most expensive thing you can write.

The authoritative external source is the Chinese Minecraft Wiki:
<https://zh.minecraft.wiki/w/数据包> for structure, and the per-feature pages
(`Java版函数`, `命令/execute`, `命令/data`, `目标选择器`, `NBT路径`, `配方`,
`战利品表`, `进度定义格式`, `谓词`) for syntax. The tables in this directory were
derived from those pages; when this directory and the wiki disagree, the wiki is
right and the table should be fixed.
