# Prompt Armor | LLM 防护提示词工厂

[English](./README.md) | [简体中文](./README.zh-CN.md)

[![npm version](https://img.shields.io/npm/v/@chenpu17/prompt-armor.svg)](https://www.npmjs.com/package/@chenpu17/prompt-armor)
[![CI](https://github.com/chenpu17/prompt-armor/actions/workflows/ci.yml/badge.svg)](https://github.com/chenpu17/prompt-armor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Prompt Armor 是一个本地化工作台，专门用于为“会触发工具调用的 AI 应用”生成、评测、优化系统级安全提示词。

- 基于业务背景生成高质量防护提示词
- 生成红队攻击样本与正常对照样本
- 运行带报告和失败明细的对抗评测
- 通过 Auto-Pilot 自动闭环优化提示词
- 用 OpenAI 兼容接口分别配置 4 个模型角色
- 以流式方式执行长耗时生成、优化、评测任务

## 产品界面

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

## 它解决什么问题

如果你的产品让 LLM 输出工具调用 JSON，再由运行时去执行这些工具，那么提示词注入和不安全输出仍然可能导致文件读取、命令执行、密钥泄露、提示词泄露，或者生成违规内容。

Prompt Armor 提供的是一套可重复的工程化流程，而不是一次性的“手写安全提示词”。

## 核心能力

### 1. 防护提示词生成

- 基于业务背景、工具面和风险重点生成 system prompt
- 支持从失败样本反推并迭代优化提示词

### 2. 红队样本生成

- 基于自然语言种子生成攻击样本和正常对照样本
- 支持合并已有样本集，并保留类目覆盖信息

### 3. 对抗评测

- 配置目标模型、裁判模型、提示词、样本集和工具档案
- 跟踪通过率、拒绝率、禁用工具触发率、信息泄露率和分品类表现

### 4. 自动优化闭环

- 自动生成初版提示词与初始测试集
- 评测、收集失败、刷新薄弱类目、优化提示词，并持续循环直到达到目标阈值或不再提升

### 5. 内置 Mock 工具面

- 内置 OpenClaw 风格的 mock 工具，如 `fs`、`shell`、`network`、`memory`、`secret`、`skill_invoke`
- 工具只暴露给目标模型用于声明调用，不真正执行，系统只记录是否触发

## 工作流

### 手动模式

1. 配置四个模型角色：生成器、攻击样本生成器、目标模型、裁判模型
2. 生成或组合攻击样本集
3. 基于样本生成防护提示词
4. 对目标模型运行评测
5. 查看失败用例，并把提示词优化到下一版

### 自动优化

填写运行名称、业务背景、几条种子样本、四个模型端点和迭代轮数后，Prompt Armor 会自动执行 `generate -> evaluate -> optimize -> refresh` 的完整闭环。

## 一键启动

```bash
# 不安装直接运行
npx @chenpu17/prompt-armor

# 或全局安装
npm i -g @chenpu17/prompt-armor
prompt-armor
```

启动后默认会打开 `http://127.0.0.1:7842`，数据存放在 `~/.prompt-armor/data.db`。

### CLI 选项

```bash
prompt-armor --help
prompt-armor --version
prompt-armor --port 8080
prompt-armor --host 0.0.0.0
prompt-armor --no-open
```

环境变量：`PORT`、`HOST`、`NO_OPEN=1`、`PROMPT_ARMOR_DATA_DIR`

## 模型接入方式

Prompt Armor 采用四个独立模型角色，全部通过 OpenAI 兼容接口接入：

- 提示词生成器
- 攻击样本生成器
- 被评测目标模型
- 裁判模型

可以混合使用 OpenAI、DeepSeek、Qwen、Moonshot、Ollama 或自建兼容网关。

## 本地开发

```bash
git clone https://github.com/chenpu17/prompt-armor.git
cd prompt-armor
npm install

# 一条命令同时启动 server + web 开发模式
npm run dev

# 或拆开运行
npm run dev:server
npm run dev:web
```

构建发布产物：

```bash
npm run build
node bin/prompt-armor.js
```

## 发布

CI 会在推送到 `main` 时执行。npm 发布由推送符合 `v*` 的版本 tag 触发。

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main
git push origin vX.Y.Z
```

## 许可

MIT © chenpu17
