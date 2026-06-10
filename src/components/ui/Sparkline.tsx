// src/components/ui/Sparkline.tsx
import { LineChart, Line, ResponsiveContainer } from 'recharts'

type Props = { data: number[]; color?: string }

export function Sparkline({ data, color = '#16a34a' }: Props) {
  const d = data.map((v, i) => ({ v, i }))
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={d}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
