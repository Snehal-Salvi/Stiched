import { useState, useEffect } from 'react';
import {
  Container, Grid, Typography, Paper, Box, Avatar, Chip,
  Button, Stack, Divider, Alert, CircularProgress, Select,
  MenuItem, FormControl, TextField,
} from '@mui/material';
import { Assignment, CheckCircle, Pending, TrendingUp, Star } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getIncomingOrders, updateOrderStatus } from '../../api/orders';
import { useAuth } from '../../context/AuthContext';
import type { Order } from '../../types';
import { GARMENT_LABELS } from '../../types';
import StatusChip from '../../components/common/StatusChip';
import PageLoader from '../../components/common/PageLoader';

const NEXT_STATUSES: Partial<Record<Order['status'], Order['status'][]>> = {
  pending: ['accepted', 'rejected'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
};

export default function TailorDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deliveryDates, setDeliveryDates] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetch = () => {
    setLoading(true);
    getIncomingOrders()
      .then(({ data }) => setOrders(data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const handleStatus = async (orderId: string, status: Order['status']) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, status, deliveryDates[orderId]);
      toast.success(`Order marked as ${status.replace('_', ' ')}`);
      fetch();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    active: orders.filter((o) => ['accepted', 'in_progress'].includes(o.status)).length,
    completed: orders.filter((o) => o.status === 'completed').length,
    earnings: orders.filter((o) => o.status === 'completed').reduce((s, o) => s + o.price, 0),
  };

  if (loading) return <PageLoader />;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Dashboard</Typography>
          <Typography color="text.secondary">Welcome back, {user?.name}</Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/tailor/profile')}>
          Edit Shop Profile
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={4}>
        {[
          { label: 'Total Orders', value: stats.total, icon: <Assignment />, color: '#1a1a2e' },
          { label: 'Pending', value: stats.pending, icon: <Pending />, color: '#ffc107' },
          { label: 'Active', value: stats.active, icon: <TrendingUp />, color: '#17a2b8' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle />, color: '#28a745' },
          { label: 'Earnings', value: `₹${stats.earnings}`, icon: <Star />, color: '#c0392b' },
        ].map(({ label, value, icon, color }) => (
          <Grid item xs={6} md={2.4} key={label}>
            <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center', borderTop: `3px solid ${color}` }}>
              <Box sx={{ color, mb: 0.5 }}>{icon}</Box>
              <Typography variant="h5" fontWeight={800}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" fontWeight={700} mb={2}>Incoming Orders</Typography>

      {orders.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Assignment sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>No orders yet</Typography>
          <Typography color="text.secondary" mb={2}>Complete your shop profile to attract customers</Typography>
          <Button variant="contained" color="secondary" onClick={() => navigate('/tailor/profile')}>
            Update Profile
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {orders.map((order) => (
            <Paper key={order._id} sx={{ p: 3, borderRadius: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                <Box display="flex" gap={2} alignItems="center">
                  <Avatar src={order.customer?.avatar} sx={{ bgcolor: 'primary.main' }}>
                    {order.customer?.name?.[0]}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700}>{order.customer?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.serviceName} · {GARMENT_LABELS[order.garmentType]}
                    </Typography>
                  </Box>
                </Box>
                <StatusChip status={order.status} />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                <Chip
                  label={order.measurementType === 'send_sample' ? 'Sending sample garment' : 'Custom measurements'}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}
                  size="small"
                  variant="outlined"
                />
              </Box>

              {order.measurementType === 'custom' && Object.keys(order.measurements).length > 0 && (
                <Box mb={2} sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
                    Measurements
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {Object.entries(order.measurements).map(([k, v]) => (
                      <Chip
                        key={k}
                        label={`${k.replace(/([A-Z])/g, ' $1')}: ${v} cm`}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box display="flex" gap={3} flexWrap="wrap" mb={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Amount</Typography>
                  <Typography fontWeight={700} color="secondary.main">₹{order.price}</Typography>
                </Box>
                {order.deliveryDate && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Delivery</Typography>
                    <Typography fontWeight={600}>{new Date(order.deliveryDate).toLocaleDateString()}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">Received</Typography>
                  <Typography fontWeight={600}>{new Date(order.createdAt).toLocaleDateString()}</Typography>
                </Box>
              </Box>

              {order.notes && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  <strong>Customer notes:</strong> {order.notes}
                </Typography>
              )}

              {NEXT_STATUSES[order.status] && (
                <Box>
                  {(order.status === 'pending' || order.status === 'accepted') && (
                    <TextField
                      label="Set delivery date"
                      type="date"
                      size="small"
                      value={deliveryDates[order._id] || ''}
                      onChange={(e) => setDeliveryDates((d) => ({ ...d, [order._id]: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      sx={{ mb: 1.5 }}
                      inputProps={{ min: new Date().toISOString().split('T')[0] }}
                    />
                  )}
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {NEXT_STATUSES[order.status]!.map((nextStatus) => (
                      <Button
                        key={nextStatus}
                        size="small"
                        variant={nextStatus === 'rejected' || nextStatus === 'cancelled' ? 'outlined' : 'contained'}
                        color={nextStatus === 'rejected' || nextStatus === 'cancelled' ? 'error' : 'secondary'}
                        onClick={() => handleStatus(order._id, nextStatus)}
                        disabled={updating === order._id}
                      >
                        {updating === order._id
                          ? <CircularProgress size={16} color="inherit" />
                          : nextStatus.replace(/_/g, ' ')}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}

              {order.review && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Customer review: {order.review.rating}★ — {order.review.comment}
                </Alert>
              )}
            </Paper>
          ))}
        </Stack>
      )}
    </Container>
  );
}
