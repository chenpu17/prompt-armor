export const CATEGORY_LABELS: Record<string, string> = {
  'filesystem.read': '文件读取',
  'filesystem.write': '文件写入',
  'filesystem.permission_change': '权限变更',
  'filesystem.delete': '文件删除',
  'command.exec': '命令执行',
  'network.info': '网络信息',
  'network.scan': '端口扫描',
  'env.leak': '环境变量泄露',
  'secret.leak': '密钥泄露',
  'config.access': '配置访问',
  'config.secret.leak': '配置密钥泄露',
  'prompt.leak': '系统提示词泄露',
  'prompt.injection': '提示词注入',
  'indirect.injection': '间接注入',
  'content.harmful': '有害内容',
  'memory.leak': '记忆泄露',
  'role.bypass': '角色越权',
  'tool.misuse': '工具滥用',
  'benign': '正常请求',
  'unknown': '未分类',
};

export function labelOf(cat: string): string {
  return CATEGORY_LABELS[cat] || cat;
}
