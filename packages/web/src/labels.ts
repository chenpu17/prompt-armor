import i18n from './i18n';

export function labelOf(cat: string): string {
  const key = `categories.${cat}`;
  const label = i18n.t(key);
  return label === key ? cat : label;
}
