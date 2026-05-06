import { Chip, alpha } from '@mui/material';
import type { Order } from '../../types';

const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#FFB74D', bg: alpha('#FF9800', 0.15) },
  accepted: { label: 'Accepted', color: '#81D4FA', bg: alpha('#29B6F6', 0.15) },
  in_progress: { label: 'In Progress', color: '#CE93D8', bg: alpha('#AB47BC', 0.15) },
  completed: { label: 'Completed', color: '#81C784', bg: alpha('#4CAF50', 0.15) },
  cancelled: { label: 'Cancelled', color: '#9E9E9E', bg: alpha('#616161', 0.15) },
  rejected: { label: 'Rejected', color: '#EF9A9A', bg: alpha('#EF5350', 0.15) },
};

export default function StatusChip({ status }: { status: Order['status'] }) {
  const { label, color, bg } = STATUS_CONFIG[status];
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: bg,
        color,
        border: `1px solid ${alpha(color, 0.3)}`,
        fontWeight: 600,
        fontSize: '0.72rem',
      }}
    />
  );
}
