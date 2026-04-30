# Prompt Armor

[English](./README.md) | [简体中文](./README.zh-CN.md)

[![npm version](https://img.shields.io/npm/v/@chenpu17/prompt-armor.svg)](https://www.npmjs.com/package/@chenpu17/prompt-armor)
[![CI](https://github.com/chenpu17/prompt-armor/actions/workflows/ci.yml/badge.svg)](https://github.com/chenpu17/prompt-armor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Prompt Armor is a local workstation for generating, evaluating, and iterating system-level guardrail prompts for tool-using LLM applications.

- Generate high-quality guardrail prompts from business context
- Build red-team and benign sample sets
- Run adversarial evaluations with reports and failure traces
- Auto-iterate prompts in a closed loop with Auto-Pilot
- Configure four model roles independently via OpenAI-compatible APIs
- Stream long-running generation, optimization, and evaluation jobs in real time

## Screenshots

<table>
  <tr>
    <td><img src="https://raw.githubusercontent.com/chenpu17/prompt-armor/main/packages/web/public/screenshots/auto-pilot.png" alt="Auto-Pilot" /></td>
    <td><img src="https://raw.githubusercontent.com/chenpu17/prompt-armor/main/packages/web/public/screenshots/reports.png" alt="Evaluation Reports" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Auto-Pilot</strong></td>
    <td align="center"><strong>Reports</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/chenpu17/prompt-armor/main/packages/web/public/screenshots/prompts.png" alt="Guardrail Prompts" /></td>
    <td><img src="https://raw.githubusercontent.com/chenpu17/prompt-armor/main/packages/web/public/screenshots/samples.png" alt="Attack Samples" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Guardrail Prompts</strong></td>
    <td align="center"><strong>Attack Samples</strong></td>
  </tr>
</table>

## What It Does

If your product lets an LLM emit tool-call JSON and executes those calls inside a controlled runtime, prompt injection and unsafe completions can still lead to filesystem reads, shell execution, secret leakage, prompt leakage, or harmful content output.

Prompt Armor gives you a repeatable workflow for hardening those agents instead of treating prompt safety as one-off prompt writing.

## Core Capabilities

### 1. Guardrail Prompt Generation

- Generate a system prompt from your business context, tool surface, and threat focus
- Optimize prompts iteratively from failed evaluation cases

### 2. Red-Team Sample Generation

- Create attack sets and benign control sets from natural-language seed input
- Merge existing sets and keep category coverage visible

### 3. Adversarial Evaluation

- Configure target model, judge model, prompt, sample set, and tool profile
- Track pass rate, refusal rate, forbidden-tool trigger rate, information leakage rate, and per-category performance

### 4. Auto-Pilot Loop

- Generate an initial prompt and initial test set
- Evaluate, collect failures, refresh weak categories, optimize, and repeat until the target threshold is reached or progress stalls

### 5. Mock Tool Surface

- Ships with OpenClaw-style mock tools such as `fs`, `shell`, `network`, `memory`, `secret`, and `skill_invoke`
- Tools are declared to the target model but are not actually executed; the system only records whether they were called

## Workflow

### Manual Mode

1. Configure four model roles: generator, attack-sample generator, target, and judge
2. Generate or assemble an attack sample set
3. Generate a guardrail prompt from those samples
4. Run evaluation against the target model
5. Review failures and optimize the prompt into the next version

### Auto-Pilot

Provide a run name, business context, a few seed samples, four model endpoints, and an iteration count. Prompt Armor then runs the full `generate -> evaluate -> optimize -> refresh` loop for you.

## Quick Start

```bash
# Run without installing globally
npx @chenpu17/prompt-armor

# Or install globally
npm i -g @chenpu17/prompt-armor
prompt-armor
```

After startup, the browser opens `http://127.0.0.1:7842` by default. Data is stored in `~/.prompt-armor/data.db`.

### CLI Options

```bash
prompt-armor --help
prompt-armor --version
prompt-armor --port 8080
prompt-armor --host 0.0.0.0
prompt-armor --no-open
```

Environment variables: `PORT`, `HOST`, `NO_OPEN=1`, `PROMPT_ARMOR_DATA_DIR`

## Supported Model Setup

Prompt Armor uses four independent model roles, all configured with OpenAI-compatible APIs:

- Prompt Generator
- Attack Sample Generator
- Evaluation Target
- Judge

You can mix providers such as OpenAI, DeepSeek, Qwen, Moonshot, Ollama, or self-hosted gateways.

## Local Development

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

```bash
npm run build
node bin/prompt-armor.js
```

## Release

CI runs on pushes to `main`. npm publishing is triggered by a pushed version tag matching `v*`.

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main
git push origin vX.Y.Z
```

## License

MIT © chenpu17
