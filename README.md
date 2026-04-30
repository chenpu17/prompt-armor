# Prompt Armor | LLM 防护提示词工厂

[![npm version](https://img.shields.io/npm/v/@chenpu17/prompt-armor.svg)](https://www.npmjs.com/package/@chenpu17/prompt-armor)
[![CI](https://github.com/chenpu17/prompt-armor/actions/workflows/ci.yml/badge.svg)](https://github.com/chenpu17/prompt-armor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Prompt Armor is a local workstation for generating, evaluating, and iterating system-level guardrail prompts for tool-using LLM applications.

Prompt Armor 是一个本地化工作台，专门用于为“会触发工具调用的 AI 应用”生成、评测、优化系统级安全提示词。

- Generate high-quality guardrail prompts from business context
- Build red-team and benign sample sets
- Run adversarial evaluations with reports and failure traces
- Auto-iterate prompts in a closed loop with Auto-Pilot
- Configure four model roles independently via OpenAI-compatible APIs
- Stream long-running generation, optimization, and evaluation jobs in real time

- 基于业务背景生成高质量防护提示词
- 生成红队攻击样本与正常对照样本
- 运行带报告和失败明细的对抗评测
- 通过 Auto-Pilot 自动闭环优化提示词
- 用 OpenAI 兼容接口分别配置 4 个模型角色
- 以流式方式执行长耗时生成、优化、评测任务

## Screenshots | 产品界面

<table>
  <tr>
    <td><img src="https://raw.githubusercontent.com/chenpu17/prompt-armor/main/packages/web/public/screenshots/auto-pilot.png" alt="Auto-Pilot" /></td>
    <td><img src="https://raw.githubusercontent.com/chenpu17/prompt-armor/main/packages/web/public/screenshots/reports.png" alt="Evaluation Reports" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Auto-Pilot</strong><br/>自动优化闭环</td>
    <td align="center"><strong>Reports</strong><br/>评测报告与失败明细</td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/chenpu17/prompt-armor/main/packages/web/public/screenshots/prompts.png" alt="Guardrail Prompts" /></td>
    <td><img src="https://raw.githubusercontent.com/chenpu17/prompt-armor/main/packages/web/public/screenshots/samples.png" alt="Attack Samples" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Guardrail Prompts</strong><br/>防护提示词生成与迭代</td>
    <td align="center"><strong>Attack Samples</strong><br/>攻击样本生成与管理</td>
  </tr>
</table>

## What It Does | 它解决什么问题

If your product lets an LLM emit tool-call JSON and executes those calls inside a controlled runtime, prompt injection and unsafe completions can still lead to filesystem reads, shell execution, secret leakage, prompt leakage, or harmful content output.

如果你的产品让 LLM 输出工具调用 JSON，再由运行时去执行这些工具，那么提示词注入和不安全输出仍然可能导致文件读取、命令执行、密钥泄露、提示词泄露，或者生成违规内容。

Prompt Armor gives you a repeatable workflow for hardening those agents instead of treating prompt safety as one-off prompt writing.

Prompt Armor 提供的是一套可重复的工程化流程，而不是一次性的“手写安全提示词”。

## Core Capabilities | 核心能力

### 1. Guardrail Prompt Generation | 防护提示词生成

- Generate a system prompt from your business context, tool surface, and threat focus.
- Supports iterative optimization from failed evaluation cases.

- 基于业务背景、工具面和风险重点生成 system prompt。
- 支持从失败样本反推并迭代优化提示词。

### 2. Red-Team Sample Generation | 红队样本生成

- Create attack sets and benign control sets from natural-language seed input.
- Merge existing sets and keep category coverage visible.

- 基于自然语言种子生成攻击样本和正常对照样本。
- 支持合并已有样本集，并保留类目覆盖信息。

### 3. Adversarial Evaluation | 对抗评测

- Configure target model, judge model, prompt, sample set, and tool profile.
- Track pass rate, refusal rate, forbidden-tool trigger rate, information leakage rate, and per-category performance.

- 配置目标模型、裁判模型、提示词、样本集和工具档案。
- 跟踪通过率、拒绝率、禁用工具触发率、信息泄露率和分品类表现。

### 4. Auto-Pilot Loop | 自动优化闭环

- Generate an initial prompt and initial test set.
- Evaluate, collect failures, refresh weak categories, optimize, and repeat until the target threshold is reached or progress stalls.

- 自动生成初版提示词与初始测试集。
- 评测、收集失败、刷新薄弱类目、优化提示词，并持续循环直到达到目标阈值或不再提升。

### 5. Mock Tool Surface | 内置 Mock 工具面

- Ships with OpenClaw-style mock tools such as `fs`, `shell`, `network`, `memory`, `secret`, and `skill_invoke`.
- Tools are declared to the target model but are not actually executed; the system only records whether they were called.

- 内置 OpenClaw 风格的 mock 工具，如 `fs`、`shell`、`network`、`memory`、`secret`、`skill_invoke`。
- 工具只暴露给目标模型用于声明调用，不真正执行，系统只记录是否触发。

## Workflow | 工作流

### Manual Mode | 手动模式

1. Configure four model roles: generator, attack-sample generator, target, and judge.
2. Generate or assemble an attack sample set.
3. Generate a guardrail prompt from those samples.
4. Run evaluation against the target model.
5. Review failures and optimize the prompt into the next version.

1. 配置四个模型角色：生成器、攻击样本生成器、目标模型、裁判模型。
2. 生成或组合攻击样本集。
3. 基于样本生成防护提示词。
4. 对目标模型运行评测。
5. 查看失败用例，并把提示词优化到下一版。

### Auto-Pilot | 自动优化

Provide a run name, business context, a few seed samples, four model endpoints, and an iteration count. Prompt Armor then runs the full generate -> evaluate -> optimize -> refresh loop for you.

填写运行名称、业务背景、几条种子样本、四个模型端点和迭代轮数后，Prompt Armor 会自动执行 generate -> evaluate -> optimize -> refresh 的完整闭环。

## Quick Start | 一键启动

```bash
# Run without installing globally
npx @chenpu17/prompt-armor

# Or install globally
npm i -g @chenpu17/prompt-armor
prompt-armor
```

After startup, the browser opens `http://127.0.0.1:7842` by default. Data is stored in `~/.prompt-armor/data.db`.

启动后默认会打开 `http://127.0.0.1:7842`，数据存放在 `~/.prompt-armor/data.db`。

### CLI Options | CLI 选项

```bash
prompt-armor --help
prompt-armor --version
prompt-armor --port 8080
prompt-armor --host 0.0.0.0
prompt-armor --no-open
```

Environment variables: `PORT`, `HOST`, `NO_OPEN=1`, `PROMPT_ARMOR_DATA_DIR`

环境变量：`PORT`、`HOST`、`NO_OPEN=1`、`PROMPT_ARMOR_DATA_DIR`

## Supported Model Setup | 模型接入方式

Prompt Armor uses four independent model roles, all configured with OpenAI-compatible APIs:

Prompt Armor 采用四个独立模型角色，全部通过 OpenAI 兼容接口接入：

- Prompt Generator | 提示词生成器
- Attack Sample Generator | 攻击样本生成器
- Evaluation Target | 被评测目标模型
- Judge | 裁判模型

You can mix providers such as OpenAI, DeepSeek, Qwen, Moonshot, Ollama, or self-hosted gateways.

可以混合使用 OpenAI、DeepSeek、Qwen、Moonshot、Ollama 或自建兼容网关。

## Local Development | 本地开发

```bash
git clone https://github.com/chenpu17/prompt-armor.git
cd prompt-armor
npm install

# Start server and web dev mode together
npm run dev

# Or run them separately
npm run dev:server
npm run dev:web
```

Build production artifacts:

构建发布产物：

```bash
npm run build
node bin/prompt-armor.js
```

## Release | 发布

CI runs on pushes to `main`. npm publishing is triggered by a pushed version tag matching `v*`.

CI 会在推送到 `main` 时执行。npm 发布由推送符合 `v*` 的版本 tag 触发。

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main
git push origin vX.Y.Z
```

## License | 许可

MIT © chenpu17
