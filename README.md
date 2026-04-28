# 🛡 Prompt Armor — LLM 防护提示词工厂

> 针对"会触发工具调用的 AI 应用"，**自动化生成 / 优化 / 评测系统级安全提示词**的工厂。
> 一条命令启动，自带漂亮的 Web 界面。

## 这是什么

如果你的 AI 应用（例如 OpenClaw 这类 Agent）会让 LLM 输出工具调用 JSON，然后在受控环境里执行，那么用户的恶意输入可能让模型读 `/etc/passwd`、执行 `whoami`、泄露 API Key、生成涉黄/社工内容……

Prompt Armor 帮你：

- 🤖 **生成**：用强模型按你的业务背景生成高质量的"安全防护 system prompt"
- 🎯 **评测**：用红队攻击样本 + 正常对照样本，量化提示词的拒绝率 / 误伤率 / 工具触发率 / 信息泄露率
- 🔁 **优化**：基于失败用例，让生成模型针对性地修补 prompt
- ⚙ **解耦 4 个角色模型**：生成器 / 攻击样本生成器 / 被评测目标 / 裁判，每个独立配置（OpenAI 兼容协议）
- 🧰 **内置 OpenClaw 风格 Mock 工具集**（fs / shell / network / python_exec / memory / secret / skill_invoke 等），声明式给目标模型，仅记录是否被调用，不真正执行

## 一键启动

```bash
npx prompt-armor
```

打开 http://127.0.0.1:7842 即可。数据存放于 `~/.prompt-armor/data.db`。

## 本地开发

```bash
npm install
# 启动后端（带热更）
npm run dev:server
# 另开一个终端启动前端（带热更，代理到 :7842）
npm run dev:web
```

构建发布产物：

```bash
npm run build      # 编译 web → packages/server/public，编译 server → dist
node bin/prompt-armor.js
```

## 工作流

1. 【模型管理】配置 4 个角色（OpenAI / DeepSeek / Qwen / Ollama 等）
2. 【工具集】按需启停内置工具，调整危险等级
3. 【攻击样本】使用内置红队样本集，或一键 AI 生成更多
4. 【防护提示词】查看基线 prompt，或 AI 生成新版本
5. 【运行评测】挑选 prompt + 样本集 + 目标模型 + 裁判 → 实时流式攻防对话
6. 【评测报告】查看雷达图 + 失败用例 → 一键基于失败用例优化 prompt → 进入下一轮

## 许可

MIT
