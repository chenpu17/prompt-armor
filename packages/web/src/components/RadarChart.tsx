import { Radar, RadarChart as RC, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { labelOf } from '../labels';

export default function RadarChart({ data }: { data: { category: string; value: number }[] }) {
  const { t } = useTranslation();
  const localized = data.map(d => ({ ...d, label: labelOf(d.category) }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RC data={localized}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
        <Radar name={t('radar.passRate')} dataKey="value" stroke="#06ffa5" fill="#06ffa5" fillOpacity={0.3} />
        <Tooltip contentStyle={{ background: 'rgba(10,14,39,0.95)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 12 }} />
      </RC>
    </ResponsiveContainer>
  );
}
