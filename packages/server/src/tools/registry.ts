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
