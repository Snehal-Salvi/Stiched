import { useState, useEffect } from 'react';
import {
  Container, Grid, Box, Typography, Avatar, Rating, Button,
  Paper, Divider, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Alert, Chip,
  Step, Stepper, StepLabel, IconButton,
  FormControl, InputLabel, Select, MenuItem, ToggleButton,
  ToggleButtonGroup, alpha,
} from '@mui/material';
import {
  LocationOn, Star, CheckCircle, HourglassBottom,
  CreditCard, LocalShipping, ArrowBackIos, ArrowForwardIos,
  ContentCut, Schedule, Verified,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getTailorById } from '../../api/tailors';
import { createOrder } from '../../api/orders';
import { useAuth } from '../../context/AuthContext';
import type { Tailor, GarmentType, MeasurementType, PaymentMethod } from '../../types';
import { GARMENT_LABELS } from '../../types';
import MeasurementForm from '../../components/booking/MeasurementForm';
import PageLoader from '../../components/common/PageLoader';

const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C96D';
const GOLD_DARK = '#8B6914';
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
  const [carouselIdx, setCarouselIdx] = useState(0);

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
    setStep(0); setSelectedService(''); setMeasurements({}); setNotes(''); setPaymentMethod('cod');
    setBookOpen(true);
  };

  const canNext = () => { if (step === 0) return !!selectedService; return true; };

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

  const cover = tailor.shopPhotos?.[0]?.image;

  return (
    <Box sx={{ bgcolor: '#080808', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <Box sx={{ position: 'relative', background: `linear-gradient(135deg, #0D0D0D 0%, #1A1209 60%, ${alpha(GOLD, 0.08)} 100%)`, pt: { xs: 6, md: 8 }, pb: 4, borderBottom: `1px solid ${alpha(GOLD, 0.1)}` }}>
        {/* Back button */}
        <Box sx={{ position: 'absolute', top: 16, left: 24, zIndex: 2 }}>
          <Button onClick={() => navigate(-1)} size="small"
            sx={{ color: alpha('#fff', 0.7), bgcolor: alpha('#000', 0.35), backdropFilter: 'blur(8px)', borderRadius: 2, '&:hover': { bgcolor: alpha('#000', 0.6) } }}>
            ← Back
          </Button>
        </Box>

        <Container maxWidth="lg">
          <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
            {/* Shop photo thumbnail */}
            {cover && (
              <Box sx={{
                width: { xs: 80, md: 100 }, height: { xs: 80, md: 100 },
                borderRadius: 3, overflow: 'hidden', flexShrink: 0,
                border: `2px solid ${alpha(GOLD, 0.4)}`,
                boxShadow: `0 0 24px ${alpha(GOLD, 0.2)}`,
                bgcolor: '#0D0D0D',
              }}>
                <Box component="img" src={cover} alt="shop"
                  sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              </Box>
            )}
            <Box>
              <Chip
                label={tailor.isAvailable ? 'Accepting Orders' : 'Not Available'}
                icon={tailor.isAvailable ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <HourglassBottom sx={{ fontSize: '14px !important' }} />}
                size="small"
                sx={{
                  mb: 1.5,
                  bgcolor: tailor.isAvailable ? alpha('#4CAF50', 0.2) : alpha('#888', 0.2),
                  color: tailor.isAvailable ? '#4CAF50' : '#aaa',
                  border: `1px solid ${tailor.isAvailable ? alpha('#4CAF50', 0.4) : alpha('#888', 0.3)}`,
                }}
              />
              <Typography variant="h3" fontWeight={800} sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8', lineHeight: 1.1, fontSize: { xs: '1.8rem', md: '2.6rem' } }}>
                {tailor.shopName || tailor.user.name}
              </Typography>
              {tailor.shopName && (
                <Typography variant="body1" sx={{ color: alpha('#F5F0E8', 0.55), mt: 0.5 }}>
                  by {tailor.user.name}
                </Typography>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Body ── */}
      <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
        <Grid container spacing={4}>

          {/* ── Left sidebar ── */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: { md: 'sticky' }, top: 88 }}>

              {/* Profile card */}
              <Paper sx={{
                borderRadius: 4, overflow: 'hidden', mb: 3,
                border: `1px solid ${alpha(GOLD, 0.2)}`,
                background: 'linear-gradient(160deg, #111 0%, #0D0D0D 100%)',
                boxShadow: `0 8px 40px ${alpha(GOLD, 0.07)}`,
              }}>
                {/* Top accent */}
                <Box sx={{ height: 4, background: `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD}, ${GOLD_LIGHT})` }} />

                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                    <Avatar src={tailor.user.avatar}
                      sx={{
                        width: 88, height: 88,
                        bgcolor: alpha(GOLD, 0.15), color: GOLD, fontSize: 34, fontWeight: 700,
                        border: `3px solid ${alpha(GOLD, 0.5)}`,
                        boxShadow: `0 0 0 4px #111, 0 0 28px ${alpha(GOLD, 0.2)}`,
                      }}
                    >
                      {tailor.user.name[0]}
                    </Avatar>
                    {tailor.isAvailable && (
                      <Box sx={{ position: 'absolute', bottom: 4, right: 2, width: 16, height: 16, bgcolor: '#4CAF50', borderRadius: '50%', border: '2px solid #111' }} />
                    )}
                  </Box>

                  <Box display="flex" justifyContent="center" alignItems="center" gap={0.5} mb={0.5}>
                    <Rating value={tailor.rating} precision={0.5} size="small" readOnly />
                    <Typography variant="body2" sx={{ color: alpha(GOLD, 0.7), fontWeight: 600 }}>
                      {tailor.rating.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({tailor.totalReviews} reviews)
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2, borderColor: alpha(GOLD, 0.1) }} />

                  <Stack spacing={1.5} textAlign="left">
                    {tailor.location.city && (
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: alpha(GOLD, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <LocationOn sx={{ fontSize: 16, color: GOLD }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">Location</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {tailor.location.city}{tailor.location.state ? `, ${tailor.location.state}` : ''}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    {tailor.experience > 0 && (
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: alpha(GOLD, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Verified sx={{ fontSize: 16, color: GOLD }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">Experience</Typography>
                          <Typography variant="body2" fontWeight={500}>{tailor.experience} years</Typography>
                        </Box>
                      </Box>
                    )}
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: alpha(GOLD, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ContentCut sx={{ fontSize: 16, color: GOLD }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Speciality</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {[...new Set(tailor.services.map(s => s.category))].join(', ')}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={!tailor.isAvailable || user?.role === 'tailor'}
                    onClick={openBook}
                    sx={{
                      mt: 3, py: 1.4, borderRadius: 2, fontWeight: 700, fontSize: '1rem',
                      background: tailor.isAvailable && user?.role !== 'tailor'
                        ? `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})`
                        : undefined,
                      boxShadow: tailor.isAvailable ? `0 4px 20px ${alpha(GOLD, 0.3)}` : 'none',
                      '&:hover': { boxShadow: `0 6px 28px ${alpha(GOLD, 0.45)}` },
                    }}
                  >
                    {user?.role === 'tailor' ? 'Tailor Account' : tailor.isAvailable ? 'Book Now' : 'Not Available'}
                  </Button>
                </Box>
              </Paper>

              {/* Quick stats */}
              <Grid container spacing={1.5}>
                {[
                  { label: 'Rating', value: tailor.rating.toFixed(1), sub: '/ 5.0' },
                  { label: 'Reviews', value: tailor.totalReviews, sub: 'total' },
                  { label: 'Services', value: tailor.services.length, sub: 'offered' },
                ].map(({ label, value, sub }) => (
                  <Grid item xs={4} key={label}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3, border: `1px solid ${alpha(GOLD, 0.12)}`, bgcolor: '#111' }}>
                      <Typography fontWeight={800} sx={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.2rem' }}>
                        {value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                      <Typography variant="caption" sx={{ color: alpha(GOLD, 0.4), fontSize: '0.6rem' }}>{sub}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>

          {/* ── Main content ── */}
          <Grid item xs={12} md={8}>

            {/* About */}
            {tailor.description && (
              <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: `1px solid ${alpha(GOLD, 0.12)}`, bgcolor: '#111' }}>
                <Typography variant="overline" sx={{ color: GOLD, letterSpacing: '0.15em', fontWeight: 600, fontSize: '0.7rem' }}>
                  About
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8', mb: 1.5, mt: 0.5 }}>
                  About the Shop
                </Typography>
                <Typography color="text.secondary" lineHeight={1.8}>{tailor.description}</Typography>
              </Paper>
            )}

            {/* Services */}
            {tailor.services.length > 0 && (
              <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: `1px solid ${alpha(GOLD, 0.15)}`, bgcolor: '#111' }}>
                <Typography variant="overline" sx={{ color: GOLD, letterSpacing: '0.15em', fontWeight: 600, fontSize: '0.7rem' }}>
                  Pricing
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8', mb: 2, mt: 0.5 }}>
                  Services &amp; Prices
                </Typography>
                <Stack spacing={1.5}>
                  {tailor.services.map((svc) => (
                    <Box key={svc._id}
                      display="flex" justifyContent="space-between" alignItems="center"
                      sx={{
                        p: 2, borderRadius: 2.5,
                        border: `1px solid ${alpha(GOLD, 0.12)}`,
                        background: `linear-gradient(135deg, ${alpha(GOLD, 0.03)}, transparent)`,
                        transition: 'all 0.2s',
                        '&:hover': { border: `1px solid ${alpha(GOLD, 0.35)}`, background: `linear-gradient(135deg, ${alpha(GOLD, 0.07)}, transparent)` },
                      }}
                    >
                      <Box>
                        <Typography fontWeight={600} sx={{ color: '#F5F0E8' }}>{svc.name}</Typography>
                        <Box display="flex" gap={1} mt={0.75} flexWrap="wrap">
                          <Chip label={svc.category} size="small" variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20, borderColor: alpha(GOLD, 0.3), color: alpha(GOLD, 0.7) }} />
                          <Chip icon={<Schedule sx={{ fontSize: '12px !important' }} />}
                            label={`~${svc.turnaroundDays} days`} size="small"
                            sx={{ fontSize: '0.65rem', height: 20, bgcolor: alpha(GOLD, 0.08), color: alpha(GOLD, 0.7) }} />
                        </Box>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="h6" fontWeight={800}
                          sx={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          ₹{svc.price}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">onwards</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}

            {/* Work Samples Carousel */}
            {tailor.workSamples?.length > 0 && (
              <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${alpha(GOLD, 0.15)}`, bgcolor: '#111' }}>
                <Typography variant="overline" sx={{ color: GOLD, letterSpacing: '0.15em', fontWeight: 600, fontSize: '0.7rem' }}>
                  Portfolio
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8', mb: 2, mt: 0.5 }}>
                  Work Samples
                </Typography>

                <Box sx={{ position: 'relative' }}>
                  {/* Main image */}
                  <Box
                    onClick={() => setSelectedImg(tailor.workSamples[carouselIdx].image)}
                    sx={{ position: 'relative', height: 420, borderRadius: 3, overflow: 'hidden', cursor: 'zoom-in', boxShadow: `0 8px 32px ${alpha('#000', 0.4)}` }}
                  >
                    <Box component="img" src={tailor.workSamples[carouselIdx].image}
                      sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px) brightness(0.35)', transform: 'scale(1.1)' }}
                    />
                    <Box component="img" src={tailor.workSamples[carouselIdx].image} alt="work sample"
                      sx={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                    {/* Image counter */}
                    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2, bgcolor: alpha('#000', 0.6), backdropFilter: 'blur(8px)', borderRadius: 10, px: 1.5, py: 0.4 }}>
                      <Typography variant="caption" sx={{ color: alpha('#fff', 0.8), fontWeight: 600 }}>
                        {carouselIdx + 1} / {tailor.workSamples.length}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Arrows */}
                  {tailor.workSamples.length > 1 && (
                    <>
                      <IconButton size="small"
                        onClick={(e) => { e.stopPropagation(); setCarouselIdx((i) => (i - 1 + tailor.workSamples.length) % tailor.workSamples.length); }}
                        sx={{ position: 'absolute', left: 10, top: '45%', transform: 'translateY(-50%)', zIndex: 3, width: 36, height: 36, bgcolor: alpha('#000', 0.6), color: GOLD, backdropFilter: 'blur(8px)', '&:hover': { bgcolor: alpha(GOLD, 0.2) } }}
                      >
                        <ArrowBackIos sx={{ fontSize: 14, ml: 0.5 }} />
                      </IconButton>
                      <IconButton size="small"
                        onClick={(e) => { e.stopPropagation(); setCarouselIdx((i) => (i + 1) % tailor.workSamples.length); }}
                        sx={{ position: 'absolute', right: 10, top: '45%', transform: 'translateY(-50%)', zIndex: 3, width: 36, height: 36, bgcolor: alpha('#000', 0.6), color: GOLD, backdropFilter: 'blur(8px)', '&:hover': { bgcolor: alpha(GOLD, 0.2) } }}
                      >
                        <ArrowForwardIos sx={{ fontSize: 14 }} />
                      </IconButton>
                    </>
                  )}

                  {/* Dot indicators */}
                  <Box display="flex" justifyContent="center" gap={0.75} mt={1.5}>
                    {tailor.workSamples.map((_, i) => (
                      <Box key={i}
                        onClick={(e) => { e.stopPropagation(); setCarouselIdx(i); }}
                        sx={{ width: i === carouselIdx ? 22 : 7, height: 7, borderRadius: 4, bgcolor: i === carouselIdx ? GOLD : alpha(GOLD, 0.2), cursor: 'pointer', transition: 'all 0.25s ease' }}
                      />
                    ))}
                  </Box>

                  {/* Thumbnails */}
                  <Stack direction="row" gap={1} mt={2} sx={{ overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: alpha(GOLD, 0.3), borderRadius: 2 } }}>
                    {tailor.workSamples.map((photo, i) => (
                      <Box key={photo._id} onClick={() => setCarouselIdx(i)}
                        sx={{
                          flexShrink: 0, width: 76, height: 76, borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
                          bgcolor: '#0D0D0D',
                          border: `2px solid ${i === carouselIdx ? GOLD : alpha(GOLD, 0.1)}`,
                          boxShadow: i === carouselIdx ? `0 0 12px ${alpha(GOLD, 0.35)}` : 'none',
                          transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <img src={photo.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* ── Booking Dialog ── */}
      <Dialog open={bookOpen} onClose={() => setBookOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: '#111', border: `1px solid ${alpha(GOLD, 0.2)}`, borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Playfair Display", serif', borderBottom: `1px solid ${alpha(GOLD, 0.1)}`, pb: 2 }}>
          Book {tailor.shopName || tailor.user.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stepper activeStep={step} sx={{ mb: 3 }}>
            {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          {step === 0 && (
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Select Service</InputLabel>
                <Select value={selectedService} label="Select Service"
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
                        <span>{svc.name}</span><strong>₹{svc.price}</strong>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedServiceObj && (
                <Alert severity="info">~{selectedServiceObj.turnaroundDays} days turnaround · ₹{selectedServiceObj.price}</Alert>
              )}
              <FormControl fullWidth>
                <InputLabel>Garment Type</InputLabel>
                <Select value={garmentType} label="Garment Type" onChange={(e) => setGarmentType(e.target.value as GarmentType)}>
                  {(Object.entries(GARMENT_LABELS) as [GarmentType, string][]).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}

          {step === 1 && (
            <MeasurementForm garmentType={garmentType} measurementType={measurementType}
              measurements={measurements} onTypeChange={setMeasurementType} onMeasurementsChange={setMeasurements} />
          )}

          {step === 2 && (
            <Stack spacing={2.5}>
              <TextField label="Notes for the tailor (optional)" multiline rows={3} value={notes}
                onChange={(e) => setNotes(e.target.value)} fullWidth placeholder="Any special instructions, preferred colour, etc." />
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Payment Method</Typography>
                <ToggleButtonGroup value={paymentMethod} exclusive onChange={(_, v) => v && setPaymentMethod(v)} fullWidth>
                  <ToggleButton value="cod" sx={{ gap: 1 }}><LocalShipping fontSize="small" /> Cash on Delivery</ToggleButton>
                  <ToggleButton value="card" sx={{ gap: 1 }}><CreditCard fontSize="small" /> Pay by Card</ToggleButton>
                </ToggleButtonGroup>
                {paymentMethod === 'card' && <Alert severity="info" sx={{ mt: 1.5 }}>You will be redirected to the payment gateway after confirming.</Alert>}
                {paymentMethod === 'cod' && <Alert severity="success" sx={{ mt: 1.5 }}>Pay when you collect your stitched clothes.</Alert>}
              </Box>
              {selectedServiceObj && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: alpha(GOLD, 0.2) }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>Order Summary</Typography>
                  {[
                    [selectedServiceObj.name, `₹${selectedServiceObj.price}`],
                    ['Garment', GARMENT_LABELS[garmentType]],
                    ['Measurements', measurementType === 'send_sample' ? 'Send sample garment' : 'Custom measurements'],
                  ].map(([label, val]) => (
                    <Box key={label} display="flex" justifyContent="space-between" mt={0.5}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{val}</Typography>
                    </Box>
                  ))}
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, borderTop: `1px solid ${alpha(GOLD, 0.1)}`, pt: 2 }}>
          {step > 0 && <Button onClick={() => setStep((s) => s - 1)}>Back</Button>}
          <Box flex={1} />
          <Button onClick={() => setBookOpen(false)}>Cancel</Button>
          {step < STEPS.length - 1 ? (
            <Button variant="contained" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}
              sx={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` }}>
              Next
            </Button>
          ) : (
            <Button variant="contained" onClick={handleBook} disabled={bookLoading}
              sx={{ background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})` }}>
              {bookLoading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Booking'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Lightbox */}
      <Dialog open={!!selectedImg} onClose={() => setSelectedImg(null)} maxWidth="md"
        PaperProps={{ sx: { bgcolor: '#0D0D0D', borderRadius: 3 } }}>
        <DialogContent sx={{ p: 0 }}>
          {selectedImg && <img src={selectedImg} alt="work" style={{ width: '100%', display: 'block', borderRadius: 12 }} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
