import { useState, useEffect } from 'react';
import {
  Container, Grid, Box, Typography, Avatar, Rating, Button,
  Paper, Divider, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Alert, Chip,
  Step, Stepper, StepLabel, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, ToggleButton,
  ToggleButtonGroup, alpha,
} from '@mui/material';
import {
  LocationOn, Star, CheckCircle, HourglassBottom,
  CreditCard, LocalShipping, ArrowBackIos, ArrowForwardIos,
  ContentCut, Schedule, Verified, Instagram, Facebook, WhatsApp, Map,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getTailorById } from '../../api/tailors';
import { createOrder } from '../../api/orders';
import { useAuth } from '../../context/AuthContext';
import type { Tailor, TailorService, GarmentType, MeasurementType, PaymentMethod } from '../../types';
import { GARMENT_LABELS } from '../../types';
import MeasurementForm from '../../components/booking/MeasurementForm';
import PageLoader from '../../components/common/PageLoader';

const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C96D';
const GOLD_DARK = '#8B6914';
const STEPS = ['Select Service', 'Measurements', 'Payment'];
const SOCIAL_COLORS = {
  instagram: '#E4405F',
  whatsapp: '#25D366',
  facebook: '#1877F2',
};

const getSocialLinks = (tailor: Tailor) => ({
  instagram: tailor.socialLinks?.instagram || 'https://instagram.com/stiched.tailors',
  whatsapp: tailor.socialLinks?.whatsapp || 'https://wa.me/919876543210',
  facebook: tailor.socialLinks?.facebook || 'https://facebook.com/stichedtailors',
});

const getLocationText = (tailor: Tailor) =>
  [tailor.shopName, tailor.location.city, tailor.location.state, tailor.location.pincode]
    .filter(Boolean)
    .join(', ');

const inferGarmentType = (service: TailorService): GarmentType => {
  const text = `${service.name} ${service.category}`.toLowerCase();
  const category = service.category.toLowerCase();

  if (text.includes('alter') || text.includes('hemming') || text.includes('taper') || text.includes('zip')) return 'alteration';
  if (category.includes('men')) {
    if (text.includes('pants') || text.includes('trouser') || text.includes('chinos') || text.includes('jeans')) return 'mens_pants';
    if (text.includes('kurta') || text.includes('sherwani') || text.includes('bandhgala')) return 'kurta';
    return 'mens_shirt';
  }
  if (text.includes('lehenga')) return 'lehenga';
  if (text.includes('blouse') || text.includes('saree')) return 'blouse';
  if (text.includes('salwar') || text.includes('kameez') || text.includes('anarkali') || text.includes('churidar') || text.includes('punjabi') || text.includes('sharara') || text.includes('palazzo') || text.includes('suit')) return 'salwar_kameez';
  if (text.includes('gown') || text.includes('dress') || text.includes('frock')) return 'dress';
  if (text.includes('kurta') || text.includes('sherwani') || text.includes('bandhgala')) return 'kurta';
  if (text.includes('embroidery') || text.includes('zari') || text.includes('aari') || text.includes('bead') || text.includes('sequin')) return 'other';

  return 'other';
};

const getGarmentOptions = (service?: TailorService): GarmentType[] => {
  if (!service) return Object.keys(GARMENT_LABELS) as GarmentType[];

  const category = service.category.toLowerCase();
  const inferred = inferGarmentType(service);

  if (category.includes('women')) return ['blouse', 'salwar_kameez', 'lehenga', 'dress', 'kurta', 'other'];
  if (category.includes('men')) return ['mens_shirt', 'mens_pants', 'kurta', 'other'];
  if (category.includes('alter')) return ['alteration', 'blouse', 'dress', 'mens_shirt', 'mens_pants', 'other'];
  if (category.includes('kid')) return ['dress', 'kurta', 'other'];
  if (category.includes('embroider')) return ['blouse', 'salwar_kameez', 'lehenga', 'dress', 'kurta', 'other'];

  return [inferred, 'other' as GarmentType].filter((value, index, arr) => arr.indexOf(value) === index);
};

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
  const [measurementTouched, setMeasurementTouched] = useState(false);
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
    setStep(0); setSelectedService(''); setMeasurements({}); setMeasurementTouched(false); setNotes(''); setPaymentMethod('cod');
    setBookOpen(true);
  };

  const hasMeasurementValue = Object.values(measurements).some((value) => String(value).trim() !== '');
  const isMeasurementStepValid = measurementType === 'send_sample' || hasMeasurementValue;
  const showMeasurementError = step === 1 && measurementTouched && !isMeasurementStepValid;
  const canNext = () => {
    if (step === 0) return !!selectedService;
    if (step === 1) return isMeasurementStepValid;
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

  const cover = tailor.shopPhotos?.[0]?.image;
  const socialLinks = getSocialLinks(tailor);
  const locationText = getLocationText(tailor);
  const mapQuery = encodeURIComponent(locationText || 'tailor shop near me');
  const garmentOptions = getGarmentOptions(selectedServiceObj);

  return (
    <Box sx={{ bgcolor: '#080808', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <Box sx={{ position: 'relative', background: `linear-gradient(135deg, #0D0D0D 0%, #1A1209 60%, ${alpha(GOLD, 0.08)} 100%)`, py: { xs: 2.5, md: 3 }, borderBottom: `1px solid ${alpha(GOLD, 0.1)}` }}>
        <Container maxWidth="xl">
          <Button
            onClick={() => navigate(-1)}
            size="small"
            sx={{
              color: alpha('#fff', 0.7),
              bgcolor: alpha('#000', 0.35),
              backdropFilter: 'blur(8px)',
              borderRadius: 2,
              mb: 1.5,
              '&:hover': { bgcolor: alpha('#000', 0.6) },
            }}
          >
            ← Back
          </Button>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            {/* Shop photo thumbnail */}
            {cover && (
              <Box sx={{
                width: { xs: 80, md: 100 }, height: { xs: 80, md: 100 },
                borderRadius: 2, overflow: 'hidden', flexShrink: 0,
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
                  mb: 1,
                  bgcolor: tailor.isAvailable ? alpha('#4CAF50', 0.2) : alpha('#888', 0.2),
                  color: tailor.isAvailable ? '#4CAF50' : '#aaa',
                  border: `1px solid ${tailor.isAvailable ? alpha('#4CAF50', 0.4) : alpha('#888', 0.3)}`,
                }}
              />
              <Typography variant="h3" fontWeight={800} sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8', lineHeight: 1.05, fontSize: { xs: '1.55rem', md: '2.1rem' } }}>
                {tailor.shopName || tailor.user?.name || 'Tailor'}
              </Typography>
              {tailor.shopName && tailor.user?.name && (
                <Typography variant="body1" sx={{ color: alpha('#F5F0E8', 0.55), mt: 0.5 }}>
                  by {tailor.user.name}
                </Typography>
              )}
              <Stack direction="row" gap={0.75} mt={1}>
                {[
                  { label: 'Instagram', href: socialLinks.instagram, icon: <Instagram fontSize="small" />, color: SOCIAL_COLORS.instagram },
                  { label: 'WhatsApp', href: socialLinks.whatsapp, icon: <WhatsApp fontSize="small" />, color: SOCIAL_COLORS.whatsapp },
                  { label: 'Facebook', href: socialLinks.facebook, icon: <Facebook fontSize="small" />, color: SOCIAL_COLORS.facebook },
                ].map(({ label, href, icon, color }) => (
                  <Tooltip title={label} key={label}>
                    <IconButton
                      component="a"
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        width: 34,
                        height: 34,
                        color,
                        bgcolor: alpha(color, 0.1),
                        border: `1px solid ${alpha(color, 0.28)}`,
                        '&:hover': { bgcolor: alpha(color, 0.18), borderColor: alpha(color, 0.55) },
                      }}
                    >
                      {icon}
                    </IconButton>
                  </Tooltip>
                ))}
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Body ── */}
      <Container maxWidth="xl" sx={{ pt: 2.5, pb: 4 }}>
        <Grid container spacing={2.5}>

          {/* ── Left sidebar ── */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: { md: 'sticky' }, top: 84 }}>

              {/* Profile card */}
              <Paper sx={{
                borderRadius: 2, overflow: 'hidden', mb: 2,
                border: `1px solid ${alpha(GOLD, 0.2)}`,
                background: 'linear-gradient(160deg, #111 0%, #0D0D0D 100%)',
                boxShadow: `0 8px 40px ${alpha(GOLD, 0.07)}`,
              }}>
                {/* Top accent */}
                <Box sx={{ height: 4, background: `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD}, ${GOLD_LIGHT})` }} />

                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-block', mb: 1.25 }}>
                    <Avatar src={tailor.user?.avatar}
                      sx={{
                        width: 64, height: 64,
                        bgcolor: alpha(GOLD, 0.15), color: GOLD, fontSize: 26, fontWeight: 700,
                        border: `3px solid ${alpha(GOLD, 0.5)}`,
                        boxShadow: `0 0 0 4px #111, 0 0 28px ${alpha(GOLD, 0.2)}`,
                      }}
                    >
                      {tailor.user?.name?.[0] || 'T'}
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

                  <Divider sx={{ my: 1.5, borderColor: alpha(GOLD, 0.1) }} />

                  <Stack spacing={1.1} textAlign="left">
                    {tailor.location.city && (
                      <Box display="flex" alignItems="center" gap={1.25}>
                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(GOLD, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                      <Box display="flex" alignItems="center" gap={1.25}>
                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(GOLD, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Verified sx={{ fontSize: 16, color: GOLD }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">Experience</Typography>
                          <Typography variant="body2" fontWeight={500}>{tailor.experience} years</Typography>
                        </Box>
                      </Box>
                    )}
                    <Box display="flex" alignItems="center" gap={1.25}>
                      <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(GOLD, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                      mt: 2, py: 1.1, borderRadius: 1.5, fontWeight: 700, fontSize: '0.95rem',
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

            {/* Work Samples Carousel */}
            {tailor.workSamples?.length > 0 && (
              <Paper sx={{ p: 2, borderRadius: 2, mb: 2, border: `1px solid ${alpha(GOLD, 0.15)}`, bgcolor: '#111' }}>
                <Typography variant="overline" sx={{ color: GOLD, letterSpacing: '0.15em', fontWeight: 600, fontSize: '0.7rem' }}>
                  Portfolio
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8', mb: 1.2, mt: 0.25 }}>
                  Work Samples
                </Typography>

                <Box sx={{ position: 'relative' }}>
                  {/* Main image */}
                  <Box
                    onClick={() => setSelectedImg(tailor.workSamples[carouselIdx].image)}
                    sx={{ position: 'relative', height: { xs: 260, md: 320 }, borderRadius: 2, overflow: 'hidden', cursor: 'zoom-in', boxShadow: `0 8px 32px ${alpha('#000', 0.4)}` }}
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
                  <Box display="flex" justifyContent="center" gap={0.75} mt={1}>
                    {tailor.workSamples.map((_, i) => (
                      <Box key={i}
                        onClick={(e) => { e.stopPropagation(); setCarouselIdx(i); }}
                        sx={{ width: i === carouselIdx ? 22 : 7, height: 7, borderRadius: 4, bgcolor: i === carouselIdx ? GOLD : alpha(GOLD, 0.2), cursor: 'pointer', transition: 'all 0.25s ease' }}
                      />
                    ))}
                  </Box>

                  {/* Thumbnails */}
                  <Stack direction="row" gap={0.75} mt={1.25} sx={{ overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: alpha(GOLD, 0.3), borderRadius: 2 } }}>
                    {tailor.workSamples.map((photo, i) => (
                      <Box key={photo._id} onClick={() => setCarouselIdx(i)}
                        sx={{
                          flexShrink: 0, width: 56, height: 56, borderRadius: 1.5, overflow: 'hidden', cursor: 'pointer',
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

            {/* Services */}
            {tailor.services.length > 0 && (
              <Paper sx={{ p: 2, borderRadius: 2, mb: 2, border: `1px solid ${alpha(GOLD, 0.15)}`, bgcolor: '#111' }}>
                <Typography variant="overline" sx={{ color: GOLD, letterSpacing: '0.15em', fontWeight: 600, fontSize: '0.7rem' }}>
                  Pricing
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8', mb: 1.2, mt: 0.25 }}>
                  Services &amp; Prices
                </Typography>
                <Stack spacing={1}>
                  {tailor.services.map((svc) => (
                    <Box key={svc._id}
                      display="flex" justifyContent="space-between" alignItems="center"
                      sx={{
                        p: 1.35, borderRadius: 1.5,
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
                          {svc.priceMayVary && (
                            <Chip
                              label="Price may vary"
                              size="small"
                              sx={{ fontSize: '0.65rem', height: 20, bgcolor: alpha('#29B6F6', 0.12), color: '#81D4FA' }}
                            />
                          )}
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

            {/* About */}
            {tailor.description && (
              <Paper sx={{ p: 2, borderRadius: 2, mb: 2, border: `1px solid ${alpha(GOLD, 0.12)}`, bgcolor: '#111' }}>
                <Typography variant="overline" sx={{ color: GOLD, letterSpacing: '0.15em', fontWeight: 600, fontSize: '0.7rem' }}>
                  About
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8', mb: 1, mt: 0.25 }}>
                  About the Shop
                </Typography>
                <Typography color="text.secondary" lineHeight={1.65} fontSize="0.92rem">{tailor.description}</Typography>
              </Paper>
            )}

            <Paper sx={{ p: 2, borderRadius: 2, mb: 2, border: `1px solid ${alpha(GOLD, 0.12)}`, bgcolor: '#111' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} mb={1.5} flexWrap="wrap">
                <Box>
                  <Typography variant="overline" sx={{ color: GOLD, letterSpacing: '0.15em', fontWeight: 600, fontSize: '0.7rem' }}>
                    Location
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8', mt: 0.25 }}>
                    Visit the Shop
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {locationText || 'Location details coming soon'}
                  </Typography>
                </Box>
                <Button
                  component="a"
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  variant="outlined"
                  startIcon={<Map />}
                >
                  Open in Maps
                </Button>
              </Box>
              <Box
                component="iframe"
                title={`${tailor.shopName || tailor.user?.name || 'Tailor'} location`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                sx={{
                  width: '100%',
                  height: { xs: 200, md: 220 },
                  border: 0,
                  borderRadius: 2,
                  filter: 'grayscale(0.25) invert(0.9) hue-rotate(170deg)',
                }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* ── Booking Dialog ── */}
      <Dialog open={bookOpen} onClose={() => setBookOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: '#111', border: `1px solid ${alpha(GOLD, 0.2)}`, borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Playfair Display", serif', borderBottom: `1px solid ${alpha(GOLD, 0.1)}`, pb: 2 }}>
          Book {tailor.shopName || tailor.user?.name || 'Tailor'}
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
                    if (svc) setGarmentType(inferGarmentType(svc));
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
                <Alert severity="info">
                  ~{selectedServiceObj.turnaroundDays} days turnaround · Starts at ₹{selectedServiceObj.price}
                  {selectedServiceObj.priceMayVary ? ' · Final price may vary as per customization' : ''}
                </Alert>
              )}
              <FormControl fullWidth>
                <InputLabel>Garment Type</InputLabel>
                <Select value={garmentType} label="Garment Type" onChange={(e) => setGarmentType(e.target.value as GarmentType)}>
                  {garmentOptions.map((value) => (
                    <MenuItem key={value} value={value}>{GARMENT_LABELS[value]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}

          {step === 1 && (
            <Stack spacing={2}>
              {showMeasurementError && (
                <Alert severity="warning">
                  Enter at least one measurement, or choose Send Sample Garment.
                </Alert>
              )}
              <MeasurementForm
                garmentType={garmentType}
                measurementType={measurementType}
                measurements={measurements}
                onTypeChange={(type) => {
                  setMeasurementType(type);
                  setMeasurementTouched(true);
                }}
                onMeasurementsChange={(next) => {
                  setMeasurements(next);
                  setMeasurementTouched(true);
                }}
              />
            </Stack>
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
                    ...(selectedServiceObj.priceMayVary ? [['Pricing note', 'May vary as per customization']] : []),
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
            <Button variant="contained" disabled={!canNext()} onClick={() => {
              if (step === 1 && !isMeasurementStepValid) {
                setMeasurementTouched(true);
                return;
              }
              setStep((s) => s + 1);
            }}
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
