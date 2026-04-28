import { Radar, RadarChart as RC, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function RadarChart({ data }: { data: { category: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RC data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
        <Radar name="通过率" dataKey="value" stroke="#06ffa5" fill="#06ffa5" fillOpacity={0.3} />
        <Tooltip contentStyle={{ background: 'rgba(10,14,39,0.95)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 12 }} />
      </RC>
    </ResponsiveContainer>
  );
}
