import { useState, useEffect } from 'react';
import {
  Container, Grid, Typography, Paper, Box, Avatar, Chip,
  Button, Stack, Divider, Alert, CircularProgress, TextField,
} from '@mui/material';
import {
  Assignment, CheckCircle, Pending, TrendingUp, Star,
  CalendarMonth, PlayArrow, Cancel, Block, DoneAll,
  LocalShipping, Person, Payments,
} from '@mui/icons-material';
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

const ACTION_META: Record<string, { label: string; helper: string; icon: JSX.Element; tone: 'primary' | 'danger' | 'success' }> = {
  accepted: {
    label: 'Accept order',
    helper: 'Confirm the request and share a delivery date.',
    icon: <CheckCircle />,
    tone: 'success',
  },
  rejected: {
    label: 'Reject',
    helper: 'Decline this request if you cannot take it.',
    icon: <Block />,
    tone: 'danger',
  },
  in_progress: {
    label: 'Start stitching',
    helper: 'Move this order into active work.',
    icon: <PlayArrow />,
    tone: 'primary',
  },
  completed: {
    label: 'Mark completed',
    helper: 'Use when the garment is ready for pickup.',
    icon: <DoneAll />,
    tone: 'success',
  },
  cancelled: {
    label: 'Cancel',
    helper: 'Stop this accepted order.',
    icon: <Cancel />,
    tone: 'danger',
  },
};

const statusTitle: Record<Order['status'], string> = {
  pending: 'New request',
  accepted: 'Accepted',
  in_progress: 'Stitching',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

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
    if (status === 'accepted' && !deliveryDates[orderId]) {
      toast.error('Choose a delivery date before accepting the order');
      return;
    }

    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, status, deliveryDates[orderId]);
      toast.success(`Order marked as ${statusTitle[status].toLowerCase()}`);
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
    <Box sx={{ bgcolor: '#080808', minHeight: 'calc(100vh - 76px)' }}>
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#0D0D0D',
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>Tailor Dashboard</Typography>
          <Typography color="text.secondary">Welcome back, {user?.name}</Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/tailor/profile')}>
          Edit Shop Profile
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total Orders', value: stats.total, icon: <Assignment />, color: '#90CAF9' },
          { label: 'Pending', value: stats.pending, icon: <Pending />, color: '#FFCA28' },
          { label: 'Active', value: stats.active, icon: <TrendingUp />, color: '#29B6F6' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle />, color: '#66BB6A' },
          { label: 'Earnings', value: `₹${stats.earnings}`, icon: <Payments />, color: '#E8C96D' },
        ].map(({ label, value, icon, color }) => (
          <Grid item xs={6} md={2.4} key={label}>
            <Paper sx={{ p: 2, borderRadius: 2, border: `1px solid ${color}33`, bgcolor: '#111' }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Box sx={{ color, display: 'flex' }}>{icon}</Box>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Box>
              <Typography variant="h5" fontWeight={800}>{value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" fontWeight={800} mb={2}>Incoming Orders</Typography>

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
            <Paper key={order._id} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#111' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                <Box display="flex" gap={2} alignItems="center">
                  <Avatar src={order.customer?.avatar} sx={{ bgcolor: 'primary.main' }}>
                    {order.customer?.name?.[0]}
                  </Avatar>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography fontWeight={800}>{order.customer?.name}</Typography>
                      <Chip size="small" label={statusTitle[order.status]} variant="outlined" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {order.serviceName} · {GARMENT_LABELS[order.garmentType]}
                    </Typography>
                  </Box>
                </Box>
                <StatusChip status={order.status} />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                <Chip
                  icon={<Person />}
                  label={order.measurementType === 'send_sample' ? 'Sending sample garment' : 'Custom measurements'}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<LocalShipping />}
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
                    <Typography fontWeight={600}>{formatDate(order.deliveryDate)}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">Received</Typography>
                  <Typography fontWeight={600}>{formatDate(order.createdAt)}</Typography>
                </Box>
              </Box>

              {order.notes && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  <strong>Customer notes:</strong> {order.notes}
                </Typography>
              )}

              {NEXT_STATUSES[order.status] && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(201,168,76,0.04)',
                    borderColor: 'divider',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <TrendingUp sx={{ color: 'secondary.main', fontSize: 18 }} />
                    <Typography fontWeight={800}>Next action</Typography>
                  </Box>
                  {(order.status === 'pending' || order.status === 'accepted') && (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        mb: 1.5,
                        p: 1.25,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        bgcolor: '#0D0D0D',
                      }}
                    >
                      <Box sx={{ display: 'flex', color: 'secondary.main' }}>
                        <CalendarMonth />
                      </Box>
                      <Box flex={1} minWidth={220}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Promise delivery by
                        </Typography>
                        <TextField
                          type="date"
                          size="small"
                          fullWidth
                          value={deliveryDates[order._id] || ''}
                          onChange={(e) => setDeliveryDates((d) => ({ ...d, [order._id]: e.target.value }))}
                          inputProps={{ min: new Date().toISOString().split('T')[0] }}
                          sx={{
                            mt: 0.5,
                            '& input': { colorScheme: 'dark' },
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                  <Grid container spacing={1.25}>
                    {NEXT_STATUSES[order.status]!.map((nextStatus) => (
                      <Grid item xs={12} sm={6} key={nextStatus}>
                        <Button
                          fullWidth
                          variant={ACTION_META[nextStatus].tone === 'danger' ? 'outlined' : 'contained'}
                          color={ACTION_META[nextStatus].tone === 'danger' ? 'error' : 'secondary'}
                          startIcon={updating === order._id ? undefined : ACTION_META[nextStatus].icon}
                          onClick={() => handleStatus(order._id, nextStatus)}
                          disabled={updating === order._id}
                          sx={{
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            py: 1.1,
                            '& .MuiButton-startIcon': { mr: 1 },
                          }}
                        >
                          {updating === order._id ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <Box>
                              <Typography variant="body2" fontWeight={800} lineHeight={1.1}>
                                {ACTION_META[nextStatus].label}
                              </Typography>
                              <Typography variant="caption" sx={{ opacity: 0.75, display: 'block', lineHeight: 1.2 }}>
                                {ACTION_META[nextStatus].helper}
                              </Typography>
                            </Box>
                          )}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
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
    </Box>
  );
}
