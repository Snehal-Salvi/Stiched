import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Avatar, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Rating, Stack, Alert, CircularProgress, Divider, Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMyOrders, leaveReview } from '../../api/orders';
import type { Order } from '../../types';
import { GARMENT_LABELS } from '../../types';
import StatusChip from '../../components/common/StatusChip';
import PageLoader from '../../components/common/PageLoader';

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState<number | null>(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetch = () => {
    setLoading(true);
    getMyOrders()
      .then(({ data }) => setOrders(data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const handleReview = async () => {
    if (!reviewOrder || !rating) return;
    setSubmitting(true);
    try {
      await leaveReview(reviewOrder._id, { rating, comment });
      toast.success('Review submitted!');
      setReviewOrder(null);
      setRating(5);
      setComment('');
      fetch();
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>My Orders</Typography>
      <Typography color="text.secondary" mb={3}>Track your tailoring requests</Typography>

      {orders.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6" color="text.secondary" mb={2}>No orders yet</Typography>
          <Button variant="contained" color="secondary" onClick={() => navigate('/tailors')}>
            Find a Tailor
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {orders.map((order) => (
            <Paper key={order._id} sx={{ p: 3, borderRadius: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                <Box display="flex" gap={2} alignItems="center">
                  <Avatar
                    src={order.tailor.user?.avatar}
                    sx={{ bgcolor: 'secondary.main', cursor: 'pointer' }}
                    onClick={() => navigate(`/tailors/${order.tailor._id}`)}
                  >
                    {order.tailor.user?.name?.[0]}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700}>
                      {order.tailor.shopName || order.tailor.user?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.serviceName} · {GARMENT_LABELS[order.garmentType]}
                    </Typography>
                  </Box>
                </Box>
                <StatusChip status={order.status} />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" gap={2} flexWrap="wrap" mb={1.5}>
                <Chip
                  label={order.measurementType === 'send_sample' ? 'Sample garment' : 'Custom measurements'}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={order.paymentStatus}
                  size="small"
                  color={order.paymentStatus === 'paid' ? 'success' : 'default'}
                />
              </Box>

              <Box display="flex" gap={3} flexWrap="wrap">
                <Box>
                  <Typography variant="caption" color="text.secondary">Amount</Typography>
                  <Typography fontWeight={700} color="secondary.main">₹{order.price}</Typography>
                </Box>
                {order.deliveryDate && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Delivery Date</Typography>
                    <Typography fontWeight={600}>{new Date(order.deliveryDate).toLocaleDateString()}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">Ordered</Typography>
                  <Typography fontWeight={600}>{new Date(order.createdAt).toLocaleDateString()}</Typography>
                </Box>
              </Box>

              {order.notes && (
                <Typography variant="body2" color="text.secondary" mt={1.5}>
                  <strong>Notes:</strong> {order.notes}
                </Typography>
              )}

              {order.review && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Your review: {order.review.rating}★ — {order.review.comment}
                </Alert>
              )}

              {order.status === 'completed' && !order.review && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => setReviewOrder(order)}
                >
                  Leave Review
                </Button>
              )}
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={!!reviewOrder} onClose={() => setReviewOrder(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Leave a Review</DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <Typography variant="body2" mb={1}>Rating</Typography>
            <Rating value={rating} onChange={(_, v) => setRating(v)} size="large" precision={1} />
            <TextField
              label="Comment (optional)"
              multiline rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              fullWidth sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setReviewOrder(null)}>Cancel</Button>
          <Button
            variant="contained" color="secondary"
            onClick={handleReview} disabled={!rating || submitting}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
