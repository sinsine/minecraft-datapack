# minecraft-datapack

一个给 AI 代理用的 Minecraft Java 版数据包技能，附带一个离线检查器。

检查器的用途很直接：在进游戏之前把错误找出来。数据包出错时的反馈很差。JSON 里多一个逗号，`/reload` 就完全不工作；函数里有一行写错，整个函数里所有命令一起失效；文件夹名和游戏版本对不上，数据包会安静地加载，然后什么都不做，这比直接报错更难查。通常的做法是进游戏、看到一条报错、改掉、再进游戏，十个错误就来回十次。而这些错误大部分在文件里就能看出来。

所以流程是：先查表，再写，最后用脚本一次性检查。不启动游戏也能做到能用的数据包。

## 目录

| | |
|---|---|
| `SKILL.md` | 代理执行的指令，给人看也没问题 |
| `reference/` | 按需加载的语法和结构资料 |
| `reference/data/` | 版本号、命令名、注册名，都是 JSON，避免凭记忆回答 |
| `templates/` | 常见文件的骨架 |
| `scripts/validate.mjs` | 检查器，Node 18+，无依赖 |
| `scripts/new-pack.mjs` | 新建数据包的脚手架 |
| `examples/` | 两个完整数据包，测试会保证它们一直是干净的 |
| `research/` | 版本表的数据来源，含出处和没查清的地方 |

## 安装

```bash
git clone https://github.com/sinsine/minecraft-datapack.git ~/.dsh/skills/minecraft-datapack
```

Claude Code 从 `~/.claude/skills/` 读技能，文件格式相同，换个路径就行。两个脚本需要 Node 18 或更高版本，不需要 Minecraft，也不联网。

## 用法

```bash
# 按目标版本新建数据包
node scripts/new-pack.mjs my-pack --namespace mypack --mc 1.21.8

# ……写函数、配方、进度……

# 跑一次，拿到全部问题
node scripts/validate.mjs my-pack
```

`new-pack.mjs` 会写好该版本需要的 `pack.mcmeta` 字段、load 和 tick 标签文件、三个起始函数，并选定正确的注册项目录名。这个目录名在 1.21 从复数改成了单数：1.20.4 用 `functions/`，1.21.8 用 `function/`。光是这一处，就让相当多的数据包加载成功却毫无效果。

检查器不会在第一个错误处停下。它读完整个包，按文件和行号列全部问题，每条都给出修改建议。没有错误时退出码为 0，有错误为 1。`--json` 输出机器可读的报告，`--mc` 可以按指定版本检查，`--strict` 把警告也当作失败。

## 能查出来的问题

大致按出现频率排列：

- **手写的 JSON**：尾逗号、`//` 注释、单引号、BOM、中文引号。报错会点明原因，而不是只说 `Unexpected token`。
- **版本对应的目录名**：1.21 的包里写了 `functions/`，或者 1.20.4 的包里写了 `function/`，两个方向都会报。
- **`pack.mcmeta` 的版本字段**：`pack_format` 和 `min_format` 混用，写了从未存在过的格式号，版本区间两端对不上。
- **函数行本身**：不存在的命令（带拼写建议）、行首斜杠、括号不配对、`execute` 子命令写在条件之后、缺 `run`（以条件结尾的情况除外，那是合法的）、`data` 和 `scoreboard` 参数顺序错误、`~` 和 `^` 混用。
- **宏**：`$(name)` 所在行没有以 `$` 开头、调用宏函数时没有 `with`、把宏函数写进标签（标签调用传不了参数）。
- **指向空气的引用**：`function`、`#tag`、战利品表、谓词、进度、配方引用了包里不存在的东西；反过来，没有任何文件调用的函数也会提示。
- **标签**：不带命名空间的条目（会解析成 `minecraft:`）、包含自身的标签、给配方或进度打标签（这两类没有标签）。
- **注册项的字段**：配方缺该类型必填的键、有序配方的符号没有出现在 `key` 里、战利品表的池没有条目、进度没有 criteria 或触发器不存在。
- **高版本的语法**：1.20.4 的目标里写了物品组件、1.20.5 之前用 `execute if items`、1.20.5 之后还用旧的 `attribute` 操作名。

## 查不出来的部分

它不认识原版 ID，任何 `minecraft:` 名字都会放行。它无法判断某个记分板目标是不是别的数据包创建的，所以只给警告。它不会进入 `overlays` 子包，世界生成、生物群系、维度和魔咒也只检查目录名。这些格式很大、交叉引用很多，而且 `/reload` 不会重新加载它们，写错的代价远超检查器能省下的部分。

整个过程遵循一条规则：不去报告可能是正确的东西。凡是取决于游戏版本、或者我无法从维基确认的地方，检查器就保持沉默，或者由参考文档明确写出"这一点没有查清"。一个总在误报的检查器，最后没人会看。

## 维护版本数据

版本号放在一个生成出来的文件里。新版本发布后：

```bash
node scripts/tools/build-versions.mjs research/pack-formats.json reference/data/versions.json
node scripts/validate.mjs --self-test
```

把它做成生成文件，是因为手抄版本表正是这类工具腐烂的原因。命令名和注册名是 `reference/data/` 下另外两个 JSON，手工维护，检查器直接读取，加一条命令就是加一行。

## 测试

```bash
node scripts/validate.mjs --self-test
```

会检查十三个数据包：两个示例、七个测试包，以及脚手架按三个不同版本生成的包。测试包带冻结的预期结果，所以"某个检查失效了"和"某个检查开始误报了"都会让测试失败。`fixtures/broken-pack` 里有十六处故意留下的错误，`fixtures/clean-pack` 必须一条问题都报不出来。

## 数据来源

版本表来自中文 Minecraft Wiki，能与英文 Wiki 对照的部分都核对过：数据包、Pack.mcmeta、Java版函数、命令/execute、命令/data、命令/scoreboard、目标选择器、NBT路径、文本组件、配方、战利品表、进度定义格式。

`research/` 放的是提取结果，以及更值得一看的东西：维基没有明说的地方。其中几处正是这个项目可能出错的地方，所以写下来，而不是猜过去。

## 许可

MIT，见 [LICENSE](LICENSE)。
