# 🛡 Prompt Armor — LLM 防护提示词工厂

[![npm version](https://img.shields.io/npm/v/@chenpu17/prompt-armor.svg)](https://www.npmjs.com/package/@chenpu17/prompt-armor)
[![CI](https://github.com/chenpu17/prompt-armor/actions/workflows/ci.yml/badge.svg)](https://github.com/chenpu17/prompt-armor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 针对“会触发工具调用的 AI 应用”，**自动化生成 / 优化 / 评测系统级安全提示词**的工厂。
> 一条命令启动，自带漂亮的 Web 界面。

## 这是什么

如果你的 AI 应用（例如 OpenClaw 这类 Agent）会让 LLM 输出工具调用 JSON，然后在受控环境里执行，那么用户的恶意输入可能让模型读 `/etc/passwd`、执行 `whoami`、泄露 API Key、生成涉黄/社工内容……

Prompt Armor 帮你：

- 🤖 **生成**：用强模型按你的业务背景生成高质量的"安全防护 system prompt"
- 🎯 **评测**：用红队攻击样本 + 正常对照样本，量化提示词的拒绝率 / 误伤率 / 工具触发率 / 信息泄露率
- 🔁 **优化**：基于失败用例，让生成模型针对性地修补 prompt
- ⚙ **解耦 4 个角色模型**：生成器 / 攻击样本生成器 / 被评测目标 / 裁判，每个独立配置（OpenAI 兼容协议）
- 🚀 **自动优化（Auto-Pilot）**：一次输入即可启动 N 轮自循环 — 自动生成样本/Prompt → 评测 → 基于失败用例优化 → 刷新测试集（防过拟合）→ 再评测，直到达标或不再提升
- 🧰 **内置 OpenClaw 风格 Mock 工具集**（fs / shell / network / python_exec / memory / secret / skill_invoke 等），声明式给目标模型，仅记录是否被调用，不真正执行
- 📡 **全程流式**：生成 / 优化 / 评测都用流式 token，实时看进度，长任务不超时
- 🌐 **中英双语 UI**：内置语言切换器（中文 / English），落地页 `/welcome` 与应用内帮助 `/help`

## 一键启动

```bash
# 不安装直接跑（推荐试用）
npx @chenpu17/prompt-armor

# 或全局安装
npm i -g @chenpu17/prompt-armor
prompt-armor
```

启动后浏览器自动打开 `http://127.0.0.1:7842`。数据存放于 `~/.prompt-armor/data.db`。

### CLI 选项

```bash
prompt-armor --help           # 查看帮助
prompt-armor --version        # 打印版本
prompt-armor --port 8080      # 自定义端口
prompt-armor --host 0.0.0.0   # 监听任意网卡（局域网共享）
prompt-armor --no-open        # 不自动打开浏览器
```

环境变量：`PORT` / `HOST` / `NO_OPEN=1` / `PROMPT_ARMOR_DATA_DIR`。

## 工作流

### 手动模式
1. **【模型管理】** 配置 4 个角色（OpenAI / DeepSeek / Qwen / Ollama 等任意 OpenAI 兼容协议）
2. **【攻击样本】** 输入一段自然语言描述，AI 生成红队样本集；或选择多个已有样本集合并
3. **【防护提示词】** 选择若干样本集 → AI 分析风险点 → 流式生成 system prompt（可重命名 / 编辑 / 复制）
4. **【运行评测】** 选 prompt + 模型 + 测试集 → 实时流式攻防对话 → 雷达图、明细
5. **【评测报告】** 看失败用例 → 一键基于失败用例迭代优化 prompt → 进入下一轮

### 🚀 Auto-Pilot 自动优化（推荐）
进入 **「自动优化」** 页面：填写名称 + 业务背景 + 几条种子样本 + 4 个角色模型 + 迭代轮数，点「启动」。
系统会自动：

1. 生成初版 system prompt + 初始测试集
2. 跑评测 → 收集失败用例 + 弱类目
3. 基于失败用例优化提示词 + 针对弱类目刷新测试集（防过拟合）
4. 重复直到达到目标通过率，或连续无提升提前停止

界面实时显示：分数演化曲线、轮次时间线（点进每轮的评测报告）、token 流、阶段日志。

## 本地开发

```bash
git clone https://github.com/chenpu17/prompt-armor.git
cd prompt-armor
npm install

# 一条命令同时启动 server + web 热更
npm run dev
# 也可分开
npm run dev:server   # http://127.0.0.1:7842
npm run dev:web      # http://127.0.0.1:5173 （代理到 :7842）
```

构建发布产物：

```bash
npm run build       # web → dist/public，server → dist/server
node bin/prompt-armor.js
```

## 发布

打 tag 即自动发布到 npm（GitHub Actions）：

```bash
npm version patch && git push --follow-tags
```

## 许可

MIT © chenpu17
