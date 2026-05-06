import { useState, useEffect } from 'react';
import {
  Container, Grid, Box, Typography, Avatar, Rating, Button,
  Paper, Divider, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Alert, Chip,
  ImageList, ImageListItem, Step, Stepper, StepLabel,
  FormControl, InputLabel, Select, MenuItem, ToggleButton,
  ToggleButtonGroup, alpha,
} from '@mui/material';
import {
  LocationOn, Star, CheckCircle, HourglassBottom,
  CreditCard, LocalShipping,
} from '@mui/icons-material';

const GOLD = '#C9A84C';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getTailorById } from '../../api/tailors';
import { createOrder } from '../../api/orders';
import { useAuth } from '../../context/AuthContext';
import type { Tailor, GarmentType, MeasurementType, PaymentMethod } from '../../types';
import { GARMENT_LABELS } from '../../types';
import MeasurementForm from '../../components/booking/MeasurementForm';
import PageLoader from '../../components/common/PageLoader';

const STEPS = ['Select Service', 'Measurements', 'Payment'];

export default function TailorProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookOpen, setBookOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [bookLoading, setBookLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState('');
  const [garmentType, setGarmentType] = useState<GarmentType>('blouse');
  const [measurementType, setMeasurementType] = useState<MeasurementType>('custom');
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  useEffect(() => {
    if (!id) return;
    getTailorById(id)
      .then(({ data }) => setTailor(data))
      .catch(() => toast.error('Tailor not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedServiceObj = tailor?.services.find((s) => s._id === selectedService);

  const openBook = () => {
    if (!user) { navigate('/login'); return; }
    setStep(0);
    setSelectedService('');
    setMeasurements({});
    setNotes('');
    setPaymentMethod('cod');
    setBookOpen(true);
  };

  const canNext = () => {
    if (step === 0) return !!selectedService;
    if (step === 1) return true;
    return true;
  };

  const handleBook = async () => {
    if (!tailor || !selectedServiceObj) return;
    setBookLoading(true);
    try {
      await createOrder({
        tailorId: tailor._id,
        serviceName: selectedServiceObj.name,
        garmentType,
        measurementType,
        measurements: measurementType === 'custom'
          ? Object.fromEntries(Object.entries(measurements).filter(([, v]) => v !== ''))
          : {},
        notes,
        price: selectedServiceObj.price,
        paymentMethod,
      });
      toast.success('Booking request sent! The tailor will confirm shortly.');
      setBookOpen(false);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Booking failed');
    } finally {
      setBookLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!tailor) return (
    <Container sx={{ py: 8, textAlign: 'center' }}>
      <Alert severity="error">Tailor not found.</Alert>
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Left sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', mb: 3, border: `1px solid ${alpha(GOLD, 0.18)}` }}>
            <Avatar
              src={tailor.user.avatar}
              sx={{
                width: 96, height: 96, mx: 'auto', mb: 2,
                bgcolor: alpha(GOLD, 0.15), color: GOLD, fontSize: 36, fontWeight: 700,
                border: `2px solid ${alpha(GOLD, 0.4)}`,
                boxShadow: `0 0 24px ${alpha(GOLD, 0.12)}`,
              }}
            >
              {tailor.user.name[0]}
            </Avatar>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8' }}
            >
              {tailor.shopName || tailor.user.name}
            </Typography>
            {tailor.shopName && (
              <Typography variant="body2" color="text.secondary" mb={0.5}>
                by {tailor.user.name}
              </Typography>
            )}
            <Box display="flex" justifyContent="center" alignItems="center" gap={0.5} mb={1}>
              <Rating value={tailor.rating} precision={0.5} size="small" readOnly />
              <Typography variant="body2" color="text.secondary">({tailor.totalReviews})</Typography>
            </Box>

            {tailor.isAvailable ? (
              <Chip icon={<CheckCircle />} label="Accepting Orders" color="success" size="small" sx={{ mb: 2 }} />
            ) : (
              <Chip icon={<HourglassBottom />} label="Not Available" size="small" sx={{ mb: 2 }} />
            )}

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5} textAlign="left">
              {tailor.location.city && (
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationOn color="action" fontSize="small" />
                  <Typography variant="body2">
                    {tailor.location.city}
                    {tailor.location.state ? `, ${tailor.location.state}` : ''}
                    {tailor.location.pincode ? ` — ${tailor.location.pincode}` : ''}
                  </Typography>
                </Box>
              )}
              {tailor.experience > 0 && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Star color="action" fontSize="small" />
                  <Typography variant="body2">{tailor.experience} years experience</Typography>
                </Box>
              )}
            </Stack>

            <Button
              variant="contained"
              color="secondary"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
              disabled={!tailor.isAvailable}
              onClick={openBook}
            >
              {user?.role === 'tailor'
                ? 'Tailor Account — Cannot Book'
                : tailor.isAvailable
                  ? 'Book Now'
                  : 'Not Available'}
            </Button>
          </Paper>
        </Grid>

        {/* Main content */}
        <Grid item xs={12} md={8}>
          {tailor.description && (
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={1.5}>About the Shop</Typography>
              <Typography color="text.secondary">{tailor.description}</Typography>
            </Paper>
          )}

          {tailor.services.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: `1px solid ${alpha(GOLD, 0.15)}` }}>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ fontFamily: '"Playfair Display", serif' }}>
                Services &amp; Prices
              </Typography>
              <Stack spacing={1.5}>
                {tailor.services.map((svc) => (
                  <Box
                    key={svc._id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      p: 1.5, borderRadius: 2,
                      border: `1px solid ${alpha(GOLD, 0.15)}`,
                      transition: 'all 0.2s',
                      '&:hover': { border: `1px solid ${alpha(GOLD, 0.35)}`, bgcolor: alpha(GOLD, 0.03) },
                    }}
                  >
                    <Box>
                      <Typography fontWeight={600}>{svc.name}</Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Chip label={svc.category} size="small" variant="outlined" sx={{ fontSize: '0.7rem', borderColor: alpha(GOLD, 0.3), color: alpha(GOLD, 0.7) }} />
                        <Chip
                          label={`~${svc.turnaroundDays} days`}
                          size="small"
                          sx={{ fontSize: '0.7rem', bgcolor: alpha(GOLD, 0.08), color: alpha(GOLD, 0.7) }}
                        />
                      </Box>
                      {svc.description && (
                        <Typography variant="caption" color="text.secondary">{svc.description}</Typography>
                      )}
                    </Box>
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{
                        background: `linear-gradient(135deg, #8B6914, ${GOLD})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      ₹{svc.price}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          {tailor.shopPhotos.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Shop Photos</Typography>
              <ImageList cols={2} gap={12}>
                {tailor.shopPhotos.map((photo) => (
                  <ImageListItem
                    key={photo._id}
                    sx={{ cursor: 'pointer', borderRadius: 2, overflow: 'hidden' }}
                    onClick={() => setSelectedImg(photo.image)}
                  >
                    <img src={photo.image} alt={photo.caption || 'shop'} loading="lazy" style={{ borderRadius: 8 }} />
                    {photo.caption && (
                      <Box sx={{ p: 0.5 }}>
                        <Typography variant="caption">{photo.caption}</Typography>
                      </Box>
                    )}
                  </ImageListItem>
                ))}
              </ImageList>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Booking Dialog */}
      <Dialog open={bookOpen} onClose={() => setBookOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Book {tailor.shopName || tailor.user.name}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={step} sx={{ mb: 3, mt: 1 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {step === 0 && (
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Select Service</InputLabel>
                <Select
                  value={selectedService}
                  label="Select Service"
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    const svc = tailor.services.find((s) => s._id === e.target.value);
                    if (svc) {
                      const cat = svc.category.toLowerCase();
                      if (cat.includes('men')) setGarmentType('mens_shirt');
                      else if (cat.includes('alter')) setGarmentType('alteration');
                      else setGarmentType('blouse');
                    }
                  }}
                >
                  {tailor.services.map((svc) => (
                    <MenuItem key={svc._id} value={svc._id}>
                      <Box display="flex" justifyContent="space-between" width="100%">
                        <span>{svc.name}</span>
                        <strong>₹{svc.price}</strong>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedServiceObj && (
                <Alert severity="info">
                  ~{selectedServiceObj.turnaroundDays} days turnaround · ₹{selectedServiceObj.price}
                </Alert>
              )}

              <FormControl fullWidth>
                <InputLabel>Garment Type</InputLabel>
                <Select
                  value={garmentType}
                  label="Garment Type"
                  onChange={(e) => setGarmentType(e.target.value as GarmentType)}
                >
                  {(Object.entries(GARMENT_LABELS) as [GarmentType, string][]).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}

          {step === 1 && (
            <MeasurementForm
              garmentType={garmentType}
              measurementType={measurementType}
              measurements={measurements}
              onTypeChange={setMeasurementType}
              onMeasurementsChange={setMeasurements}
            />
          )}

          {step === 2 && (
            <Stack spacing={2.5}>
              <TextField
                label="Notes for the tailor (optional)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                placeholder="Any special instructions, preferred colour, etc."
              />

              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Payment Method</Typography>
                <ToggleButtonGroup
                  value={paymentMethod}
                  exclusive
                  onChange={(_, v) => v && setPaymentMethod(v)}
                  fullWidth
                >
                  <ToggleButton value="cod" sx={{ gap: 1 }}>
                    <LocalShipping fontSize="small" /> Cash on Delivery
                  </ToggleButton>
                  <ToggleButton value="card" sx={{ gap: 1 }}>
                    <CreditCard fontSize="small" /> Pay by Card
                  </ToggleButton>
                </ToggleButtonGroup>

                {paymentMethod === 'card' && (
                  <Alert severity="info" sx={{ mt: 1.5 }}>
                    You will be redirected to the payment gateway after confirming the booking.
                  </Alert>
                )}
                {paymentMethod === 'cod' && (
                  <Alert severity="success" sx={{ mt: 1.5 }}>
                    Pay when you collect your stitched clothes from the shop.
                  </Alert>
                )}
              </Box>

              {selectedServiceObj && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>Order Summary</Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">{selectedServiceObj.name}</Typography>
                    <Typography variant="body2" fontWeight={700}>₹{selectedServiceObj.price}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mt={0.5}>
                    <Typography variant="body2" color="text.secondary">Garment</Typography>
                    <Typography variant="body2">{GARMENT_LABELS[garmentType]}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mt={0.5}>
                    <Typography variant="body2" color="text.secondary">Measurements</Typography>
                    <Typography variant="body2">
                      {measurementType === 'send_sample' ? 'Send sample garment' : 'Custom measurements'}
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          {step > 0 && (
            <Button onClick={() => setStep((s) => s - 1)}>Back</Button>
          )}
          <Box flex={1} />
          <Button onClick={() => setBookOpen(false)}>Cancel</Button>
          {step < STEPS.length - 1 ? (
            <Button
              variant="contained"
              color="secondary"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              onClick={handleBook}
              disabled={bookLoading}
            >
              {bookLoading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Booking'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Image lightbox */}
      <Dialog open={!!selectedImg} onClose={() => setSelectedImg(null)} maxWidth="md">
        <DialogContent sx={{ p: 0 }}>
          {selectedImg && <img src={selectedImg} alt="shop" style={{ width: '100%', display: 'block' }} />}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
