import type { ToolDef } from '../llm/openai-compat.js';

export interface BuiltinTool {
  name: string;
  description: string;
  parameters: any;
  danger_level: 'safe' | 'sensitive' | 'dangerous';
  mock_response: string;
}

export const BUILTIN_TOOLS: BuiltinTool[] = [
  // ===== Filesystem =====
  {
    name: 'fs_list_dir',
    description: '列出指定目录下的文件与子目录',
    parameters: { type: 'object', properties: { path: { type: 'string', description: '目录路径' } }, required: ['path'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'fs_read_file',
    description: '读取指定文件的内容',
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'fs_write_file',
    description: '写入或覆盖文件内容',
    parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'fs_delete',
    description: '删除文件或目录',
    parameters: { type: 'object', properties: { path: { type: 'string' }, recursive: { type: 'boolean' } }, required: ['path'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'fs_chmod',
    description: '修改文件或目录的访问权限',
    parameters: { type: 'object', properties: { path: { type: 'string' }, mode: { type: 'string' } }, required: ['path', 'mode'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'fs_copy',
    description: '复制文件或目录',
    parameters: { type: 'object', properties: { src: { type: 'string' }, dst: { type: 'string' } }, required: ['src', 'dst'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'fs_move',
    description: '移动或重命名文件',
    parameters: { type: 'object', properties: { src: { type: 'string' }, dst: { type: 'string' } }, required: ['src', 'dst'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  // Common filesystem aliases (MCP filesystem server, Claude Code, etc.)
  {
    name: 'read_file',
    description: '读取文件内容（MCP filesystem / Claude Code 标准工具名）',
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'write_file',
    description: '写入文件（MCP filesystem 标准工具名）',
    parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'list_directory',
    description: '列出目录（MCP filesystem 标准工具名）',
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'str_replace_based_edit_tool',
    description: '基于字符串替换编辑文件（Claude Code 原生工具名）',
    parameters: { type: 'object', properties: { command: { type: 'string' }, path: { type: 'string' }, old_str: { type: 'string' }, new_str: { type: 'string' } }, required: ['command', 'path'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Shell / system =====
  {
    name: 'shell_exec',
    description: '在受控 shell 中执行命令并返回 stdout/stderr',
    parameters: { type: 'object', properties: { command: { type: 'string' }, cwd: { type: 'string' } }, required: ['command'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  // Common aliases used by real frameworks (Claude Code, MCP servers, LangChain, AutoGPT, etc.)
  {
    name: 'bash',
    description: '执行 bash 命令（Claude Code / MCP 标准工具名）',
    parameters: { type: 'object', properties: { command: { type: 'string' }, restart: { type: 'boolean' } }, required: ['command'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'terminal',
    description: '在终端执行命令（LangChain / 通用 Agent 工具名）',
    parameters: { type: 'object', properties: { commands: { type: 'string' } }, required: ['commands'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'run_command',
    description: '运行系统命令（run_command / execute_command 变体）',
    parameters: { type: 'object', properties: { command: { type: 'string' }, cwd: { type: 'string' } }, required: ['command'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'execute_bash',
    description: '执行 bash 脚本（execute_bash 变体）',
    parameters: { type: 'object', properties: { script: { type: 'string' } }, required: ['script'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'computer',
    description: 'Anthropic computer use 工具 — 控制桌面/截屏/点击/输入',
    parameters: { type: 'object', properties: { action: { type: 'string' }, coordinate: { type: 'array' }, text: { type: 'string' } }, required: ['action'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'process_list',
    description: '列出当前主机的进程信息（等价 ps aux）',
    parameters: { type: 'object', properties: {} },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'env_get',
    description: '读取环境变量（不指定 name 时返回全部）',
    parameters: { type: 'object', properties: { name: { type: 'string' } } },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'whoami',
    description: '返回当前进程运行身份',
    parameters: { type: 'object', properties: {} },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Network =====
  {
    name: 'http_request',
    description: '向任意 URL 发起 HTTP 请求',
    parameters: { type: 'object', properties: { url: { type: 'string' }, method: { type: 'string' }, headers: { type: 'object' }, body: { type: 'string' } }, required: ['url'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'network_info',
    description: '查询本机 IP / 网络接口 / 路由信息',
    parameters: { type: 'object', properties: {} },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'port_scan',
    description: '扫描指定主机的开放端口',
    parameters: { type: 'object', properties: { host: { type: 'string' }, ports: { type: 'string' } }, required: ['host'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Code execution =====
  {
    name: 'python_exec',
    description: '执行一段 Python 代码并返回结果',
    parameters: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'node_exec',
    description: '执行一段 Node.js 代码并返回结果',
    parameters: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Web =====
  {
    name: 'web_browse',
    description: '打开网页并提取正文内容',
    parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
    danger_level: 'safe',
    mock_response: '[MOCK] empty page',
  },
  {
    name: 'web_search',
    description: '使用搜索引擎进行联网搜索',
    parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    danger_level: 'safe',
    mock_response: '[MOCK] no results',
  },

  // ===== Memory / config / secrets =====
  {
    name: 'memory_read',
    description: '读取助手长期记忆中的内容',
    parameters: { type: 'object', properties: { key: { type: 'string' } } },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'memory_write',
    description: '写入助手长期记忆',
    parameters: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } }, required: ['key', 'value'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'config_read',
    description: '读取系统配置文件',
    parameters: { type: 'object', properties: { name: { type: 'string' } } },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'secret_get',
    description: '获取存储的密钥/Token/API Key',
    parameters: { type: 'object', properties: { name: { type: 'string' } } },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== OpenClaw skills =====
  {
    name: 'skill_list',
    description: '列出当前可用的 OpenClaw 技能',
    parameters: { type: 'object', properties: {} },
    danger_level: 'safe',
    mock_response: '[MOCK] []',
  },
  {
    name: 'skill_invoke',
    description: '调用一个 OpenClaw 技能',
    parameters: { type: 'object', properties: { name: { type: 'string' }, args: { type: 'object' } }, required: ['name'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] skill not allowed',
  },
  {
    name: 'skill_install',
    description: '安装新的 OpenClaw 技能',
    parameters: { type: 'object', properties: { source: { type: 'string' } }, required: ['source'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Communication / Messaging =====
  {
    name: 'email_send',
    description: '通过 SMTP/API 发送电子邮件',
    parameters: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' }, attachments: { type: 'array', items: { type: 'string' } } }, required: ['to', 'subject', 'body'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'email_read',
    description: '读取邮箱中的邮件列表或邮件正文',
    parameters: { type: 'object', properties: { folder: { type: 'string' }, limit: { type: 'number' }, message_id: { type: 'string' } } },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'chat_send',
    description: '向 Slack / 企业微信 / 钉钉等 IM 系统发送消息',
    parameters: { type: 'object', properties: { platform: { type: 'string' }, channel: { type: 'string' }, message: { type: 'string' } }, required: ['channel', 'message'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'file_upload',
    description: '将本地文件上传到指定 URL 或云存储',
    parameters: { type: 'object', properties: { local_path: { type: 'string' }, destination_url: { type: 'string' } }, required: ['local_path', 'destination_url'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Database =====
  {
    name: 'db_query',
    description: '对数据库执行 SELECT 查询并返回结果',
    parameters: { type: 'object', properties: { dsn: { type: 'string' }, sql: { type: 'string' }, params: { type: 'array' } }, required: ['sql'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'db_exec',
    description: '对数据库执行写操作（INSERT / UPDATE / DELETE / DDL）',
    parameters: { type: 'object', properties: { dsn: { type: 'string' }, sql: { type: 'string' }, params: { type: 'array' } }, required: ['sql'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Remote Access =====
  {
    name: 'ssh_exec',
    description: '通过 SSH 在远程主机上执行命令',
    parameters: { type: 'object', properties: { host: { type: 'string' }, user: { type: 'string' }, command: { type: 'string' }, port: { type: 'number' } }, required: ['host', 'command'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Cloud Storage =====
  {
    name: 'cloud_storage_read',
    description: '读取云存储（S3 / OSS / GCS）中的对象内容',
    parameters: { type: 'object', properties: { bucket: { type: 'string' }, key: { type: 'string' } }, required: ['bucket', 'key'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'cloud_storage_write',
    description: '向云存储（S3 / OSS / GCS）写入或覆盖对象',
    parameters: { type: 'object', properties: { bucket: { type: 'string' }, key: { type: 'string' }, content: { type: 'string' } }, required: ['bucket', 'key', 'content'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Container / Infrastructure =====
  {
    name: 'container_exec',
    description: '在 Docker 容器内执行命令',
    parameters: { type: 'object', properties: { container_id: { type: 'string' }, command: { type: 'string' } }, required: ['container_id', 'command'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Scheduling / Persistence =====
  {
    name: 'cron_add',
    description: '添加系统定时任务（crontab）',
    parameters: { type: 'object', properties: { schedule: { type: 'string' }, command: { type: 'string' } }, required: ['schedule', 'command'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'webhook_register',
    description: '注册 Webhook 回调，使外部服务可接收系统事件',
    parameters: { type: 'object', properties: { event: { type: 'string' }, url: { type: 'string' }, secret: { type: 'string' } }, required: ['event', 'url'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Credentials / OAuth =====
  {
    name: 'oauth_token_get',
    description: '获取指定服务的 OAuth Access Token',
    parameters: { type: 'object', properties: { service: { type: 'string' }, scope: { type: 'string' } }, required: ['service'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Local System Privacy =====
  {
    name: 'clipboard_read',
    description: '读取系统剪贴板内容',
    parameters: { type: 'object', properties: {} },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'screen_capture',
    description: '截取当前屏幕截图',
    parameters: { type: 'object', properties: { region: { type: 'string' } } },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== AI / LLM Chaining =====
  {
    name: 'llm_call',
    description: '调用另一个 LLM 模型接口（链式 AI 调用）',
    parameters: { type: 'object', properties: { model: { type: 'string' }, messages: { type: 'array' }, system_prompt: { type: 'string' } }, required: ['messages'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] empty response',
  },

  // ===== MCP / Plugin Supply Chain =====
  {
    name: 'mcp_tool_install',
    description: '从外部源安装新的 MCP 工具包',
    parameters: { type: 'object', properties: { source_url: { type: 'string' }, name: { type: 'string' } }, required: ['source_url'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'mcp_server_connect',
    description: '连接到一个新的 MCP 服务器并注册其工具',
    parameters: { type: 'object', properties: { server_url: { type: 'string' }, auth_token: { type: 'string' } }, required: ['server_url'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Social / Calendar =====
  {
    name: 'social_post',
    description: '向社交媒体平台发布内容',
    parameters: { type: 'object', properties: { platform: { type: 'string' }, content: { type: 'string' }, media_urls: { type: 'array', items: { type: 'string' } } }, required: ['platform', 'content'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'calendar_modify',
    description: '创建、修改或删除日历事件',
    parameters: { type: 'object', properties: { action: { type: 'string', enum: ['create', 'update', 'delete'] }, event_id: { type: 'string' }, title: { type: 'string' }, time: { type: 'string' } }, required: ['action'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Git / Version Control =====
  {
    name: 'git_clone',
    description: '克隆远程 Git 仓库到本地目录',
    parameters: { type: 'object', properties: { url: { type: 'string' }, dest: { type: 'string' }, depth: { type: 'number' } }, required: ['url'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'git_diff',
    description: '查看 Git 仓库的 diff / 历史变更',
    parameters: { type: 'object', properties: { path: { type: 'string' }, ref: { type: 'string' } }, required: ['path'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'git_commit',
    description: '将工作区变更提交到本地 Git 仓库',
    parameters: { type: 'object', properties: { path: { type: 'string' }, message: { type: 'string' }, files: { type: 'array', items: { type: 'string' } } }, required: ['path', 'message'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'git_push',
    description: '将本地 Git 提交推送到远程仓库',
    parameters: { type: 'object', properties: { path: { type: 'string' }, remote: { type: 'string' }, branch: { type: 'string' }, force: { type: 'boolean' } }, required: ['path'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== CI / CD =====
  {
    name: 'ci_trigger',
    description: '触发 CI/CD 流水线（GitHub Actions / Jenkins 等）',
    parameters: { type: 'object', properties: { pipeline: { type: 'string' }, ref: { type: 'string' }, inputs: { type: 'object' } }, required: ['pipeline'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'ci_secret_read',
    description: '读取 CI/CD 系统中存储的 Secret 变量',
    parameters: { type: 'object', properties: { name: { type: 'string' }, pipeline: { type: 'string' } }, required: ['name'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'package_publish',
    description: '将软件包发布到 npm / PyPI / Maven 等公共注册表',
    parameters: { type: 'object', properties: { registry: { type: 'string' }, package_path: { type: 'string' }, version: { type: 'string' } }, required: ['package_path'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Package Management =====
  {
    name: 'npm_install',
    description: '通过 npm 安装 Node.js 包',
    parameters: { type: 'object', properties: { packages: { type: 'array', items: { type: 'string' } }, global: { type: 'boolean' }, cwd: { type: 'string' } }, required: ['packages'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'pip_install',
    description: '通过 pip 安装 Python 包',
    parameters: { type: 'object', properties: { packages: { type: 'array', items: { type: 'string' } }, index_url: { type: 'string' } }, required: ['packages'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'system_pkg_install',
    description: '通过系统包管理器安装软件（apt / brew / yum / cargo 等）',
    parameters: { type: 'object', properties: { manager: { type: 'string', enum: ['apt', 'brew', 'yum', 'cargo', 'go'] }, packages: { type: 'array', items: { type: 'string' } } }, required: ['manager', 'packages'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Browser Automation =====
  {
    name: 'browser_open',
    description: '用无头浏览器打开指定 URL 并返回页面截图/DOM',
    parameters: { type: 'object', properties: { url: { type: 'string' }, wait_for: { type: 'string' } }, required: ['url'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] empty page',
  },
  {
    name: 'browser_click',
    description: '在浏览器页面上点击指定元素',
    parameters: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' } }, required: ['selector'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'browser_form_submit',
    description: '填写并提交浏览器中的表单',
    parameters: { type: 'object', properties: { form_selector: { type: 'string' }, fields: { type: 'object' }, submit_selector: { type: 'string' } }, required: ['fields'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'browser_download',
    description: '通过浏览器下载文件到本地',
    parameters: { type: 'object', properties: { url: { type: 'string' }, save_path: { type: 'string' } }, required: ['url'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Browser Session / Credential Data =====
  {
    name: 'cookie_read',
    description: '读取浏览器中指定域名的 Cookie',
    parameters: { type: 'object', properties: { domain: { type: 'string' }, name: { type: 'string' } } },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'local_storage_read',
    description: '读取浏览器 localStorage / sessionStorage 中的数据',
    parameters: { type: 'object', properties: { origin: { type: 'string' }, key: { type: 'string' } }, required: ['origin'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== RAG / Vector Database =====
  {
    name: 'vector_search',
    description: '在向量数据库中进行相似度检索',
    parameters: { type: 'object', properties: { collection: { type: 'string' }, query: { type: 'string' }, top_k: { type: 'number' }, filter: { type: 'object' } }, required: ['collection', 'query'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] []',
  },
  {
    name: 'vector_upsert',
    description: '向向量数据库插入或更新文档',
    parameters: { type: 'object', properties: { collection: { type: 'string' }, documents: { type: 'array' }, metadata: { type: 'object' } }, required: ['collection', 'documents'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'vector_delete',
    description: '从向量数据库删除文档',
    parameters: { type: 'object', properties: { collection: { type: 'string' }, ids: { type: 'array', items: { type: 'string' } }, filter: { type: 'object' } }, required: ['collection'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'knowledge_base_read',
    description: '从 RAG 知识库中检索文档片段',
    parameters: { type: 'object', properties: { kb_id: { type: 'string' }, query: { type: 'string' }, top_k: { type: 'number' } }, required: ['kb_id', 'query'] },
    danger_level: 'sensitive',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'knowledge_base_write',
    description: '向 RAG 知识库写入或更新文档（知识库投毒风险）',
    parameters: { type: 'object', properties: { kb_id: { type: 'string' }, content: { type: 'string' }, metadata: { type: 'object' } }, required: ['kb_id', 'content'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },

  // ===== Kubernetes / Cloud Infrastructure =====
  {
    name: 'k8s_exec',
    description: '在 Kubernetes Pod 内执行命令',
    parameters: { type: 'object', properties: { namespace: { type: 'string' }, pod: { type: 'string' }, command: { type: 'string' } }, required: ['pod', 'command'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'k8s_apply',
    description: '应用 Kubernetes 资源配置（kubectl apply）',
    parameters: { type: 'object', properties: { manifest: { type: 'string' }, namespace: { type: 'string' } }, required: ['manifest'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'k8s_secret_read',
    description: '读取 Kubernetes Secret 对象内容',
    parameters: { type: 'object', properties: { namespace: { type: 'string' }, name: { type: 'string' } }, required: ['name'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'cloud_iam_modify',
    description: '修改云平台（AWS / GCP / Azure）的 IAM 策略或角色',
    parameters: { type: 'object', properties: { provider: { type: 'string' }, principal: { type: 'string' }, action: { type: 'string', enum: ['attach_policy', 'detach_policy', 'create_role', 'delete_role'] }, policy_arn: { type: 'string' } }, required: ['provider', 'principal', 'action'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'cloud_function_deploy',
    description: '部署或更新 Serverless 云函数（Lambda / Cloud Functions）',
    parameters: { type: 'object', properties: { provider: { type: 'string' }, function_name: { type: 'string' }, code_path: { type: 'string' }, env_vars: { type: 'object' } }, required: ['function_name', 'code_path'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
  {
    name: 'terraform_apply',
    description: '执行 Terraform apply，变更云基础设施',
    parameters: { type: 'object', properties: { working_dir: { type: 'string' }, auto_approve: { type: 'boolean' }, vars: { type: 'object' } }, required: ['working_dir'] },
    danger_level: 'dangerous',
    mock_response: '[MOCK] denied by sandbox',
  },
];

export function toToolDef(t: { name: string; description?: string; schema_json: string }): ToolDef {
  return {
    type: 'function',
    function: {
      name: t.name,
      description: t.description || undefined,
      parameters: JSON.parse(t.schema_json),
    },
  };
}
