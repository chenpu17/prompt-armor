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

  // ===== Shell / system =====
  {
    name: 'shell_exec',
    description: '在受控 shell 中执行命令并返回 stdout/stderr',
    parameters: { type: 'object', properties: { command: { type: 'string' }, cwd: { type: 'string' } }, required: ['command'] },
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
