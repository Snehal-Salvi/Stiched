import { useState } from 'react';
import {
  Box, Typography, Button, Container, Grid, Chip, Avatar,
  Stack, TextField, InputAdornment, CircularProgress, alpha,
} from '@mui/material';
import { Search, MyLocation, ContentCut, CheckCircle, Star, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C96D';
const GOLD_DARK = '#8B6914';

const SERVICE_CHIPS = [
  { label: 'Blouse', emoji: '👗' },
  { label: 'Salwar Kameez', emoji: '🪡' },
  { label: 'Lehenga', emoji: '✨' },
  { label: 'Dress', emoji: '👘' },
  { label: "Men's Shirt", emoji: '👔' },
  { label: "Men's Pants", emoji: '👖' },
  { label: 'Kurta', emoji: '🧵' },
  { label: 'Alterations', emoji: '✂️' },
];

const STATS = [
  { label: 'Tailors', value: '500+' },
  { label: 'Orders Done', value: '20K+' },
  { label: 'Happy Customers', value: '15K+' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Find Your Tailor',
    desc: 'Search by city or detect your location. Filter by service — blouse, lehenga, men\'s wear, alterations.',
  },
  {
    step: '02',
    title: 'Book & Measure',
    desc: 'Pick a service, enter measurements using our size chart, or say you\'ll send a sample garment.',
  },
  {
    step: '03',
    title: 'Pay & Relax',
    desc: 'Pay by card or cash on delivery. The tailor handles the rest and notifies you when ready.',
  },
  {
    step: '04',
    title: 'Collect & Enjoy',
    desc: 'Pick up your perfectly stitched clothes. Leave a review and book again anytime.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [detecting, setDetecting] = useState(false);

  const detectCity = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          );
          const data = await res.json();
          setCity(
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            ''
          );
        } catch { /* silent */ } finally { setDetecting(false); }
      },
      () => setDetecting(false)
    );
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    navigate(`/tailors?${params.toString()}`);
  };

  return (
    <Box sx={{ bgcolor: '#080808' }}>
      {/* ── Hero ── */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 10, md: 16 },
          pb: { xs: 10, md: 14 },
          px: 2,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '30%',
            left: '-10%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(GOLD, 0.06)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container alignItems="center" spacing={6}>
            <Grid item xs={12} md={7}>
              <Typography
                variant="overline"
                sx={{
                  color: GOLD,
                  letterSpacing: '0.2em',
                  fontWeight: 600,
                  display: 'block',
                  mb: 2,
                }}
              >
                Tailored to Perfection
              </Typography>

              <Typography
                variant="h2"
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  mb: 3,
                  fontSize: { xs: '2.4rem', md: '3.6rem' },
                  color: '#F5F0E8',
                }}
              >
                Your Tailor,{' '}
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD}, ${GOLD_LIGHT})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Just a Tap
                </Box>
                {' '}Away
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: alpha('#F5F0E8', 0.55),
                  fontWeight: 400,
                  mb: 5,
                  maxWidth: 520,
                  lineHeight: 1.7,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Book blouses, salwar kameez, lehengas, shirts and more from the best tailors
                in your city — without stepping out.
              </Typography>

              {/* Search bar */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexWrap: { xs: 'wrap', sm: 'nowrap' },
                  mb: 6,
                  maxWidth: 560,
                  bgcolor: '#131313',
                  border: `1px solid ${alpha(GOLD, 0.3)}`,
                  borderRadius: '12px',
                  p: 0.75,
                  boxShadow: `0 0 30px ${alpha(GOLD, 0.08)}`,
                  '&:focus-within': {
                    border: `1px solid ${alpha(GOLD, 0.6)}`,
                    boxShadow: `0 0 30px ${alpha(GOLD, 0.15)}`,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <TextField
                  placeholder="Enter your city..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { border: 'none' },
                      bgcolor: 'transparent',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: alpha(GOLD, 0.6), fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={detectCity}
                          disabled={detecting}
                          startIcon={detecting ? <CircularProgress size={13} sx={{ color: GOLD }} /> : <MyLocation fontSize="small" />}
                          sx={{
                            color: GOLD,
                            fontSize: '0.78rem',
                            whiteSpace: 'nowrap',
                            px: 1,
                            '&:hover': { bgcolor: alpha(GOLD, 0.08) },
                          }}
                        >
                          {detecting ? 'Detecting...' : 'My Location'}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  sx={{ flexShrink: 0, borderRadius: '8px', px: 3, minWidth: 100 }}
                >
                  Search
                </Button>
              </Box>

              {/* Stats */}
              <Stack direction="row" gap={5}>
                {STATS.map(({ label, value }) => (
                  <Box key={label}>
                    <Typography
                      variant="h4"
                      sx={{
                        background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 800,
                        fontFamily: '"Playfair Display", serif',
                      }}
                    >
                      {value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: alpha('#F5F0E8', 0.45) }}>
                      {label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>

            {/* Hero visual */}
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                {/* Outer ring */}
                <Box
                  sx={{
                    width: 360,
                    height: 360,
                    borderRadius: '50%',
                    border: `1px solid ${alpha(GOLD, 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 20,
                      borderRadius: '50%',
                      border: `1px dashed ${alpha(GOLD, 0.15)}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 160,
                      height: 160,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${alpha(GOLD, 0.12)} 0%, ${alpha(GOLD, 0.04)} 100%)`,
                      border: `2px solid ${alpha(GOLD, 0.4)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 60px ${alpha(GOLD, 0.2)}, 0 8px 32px rgba(0,0,0,0.5)`,
                    }}
                  >
                    <ContentCut
                      sx={{
                        fontSize: 72,
                        color: GOLD,
                        filter: `drop-shadow(0 0 12px ${alpha(GOLD, 0.5)})`,
                        transform: 'rotate(-45deg)',
                      }}
                    />
                  </Box>
                </Box>

                {/* Floating badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 30,
                    right: -10,
                    bgcolor: '#1A1A1A',
                    border: `1px solid ${alpha(GOLD, 0.3)}`,
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    boxShadow: `0 8px 24px rgba(0,0,0,0.5)`,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Star sx={{ color: GOLD, fontSize: 16 }} />
                    <Typography variant="body2" fontWeight={700} color={GOLD}>4.9 / 5 Rating</Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    position: 'absolute',
                    top: 40,
                    left: -20,
                    bgcolor: '#1A1A1A',
                    border: `1px solid ${alpha(GOLD, 0.3)}`,
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    boxShadow: `0 8px 24px rgba(0,0,0,0.5)`,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle sx={{ color: '#4CAF50', fontSize: 16 }} />
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#F5F0E8' }}>
                      500+ Tailors
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Browse by Garment ── */}
      <Box
        sx={{
          py: 8,
          borderTop: `1px solid ${alpha(GOLD, 0.12)}`,
          borderBottom: `1px solid ${alpha(GOLD, 0.12)}`,
          bgcolor: '#0D0D0D',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            textAlign="center"
            mb={1}
            sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8' }}
          >
            What do you need stitched?
          </Typography>
          <Typography
            color="text.secondary"
            textAlign="center"
            mb={4}
            sx={{ fontFamily: 'Inter, sans-serif' }}
          >
            Pick a garment and find tailors who specialise in it
          </Typography>

          <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={1.5}>
            {SERVICE_CHIPS.map(({ label, emoji }) => (
              <Chip
                key={label}
                label={`${emoji}  ${label}`}
                clickable
                onClick={() => navigate(`/tailors`)}
                variant="outlined"
                sx={{
                  fontSize: '0.9rem',
                  py: 2.5,
                  px: 1.5,
                  borderRadius: '40px',
                  borderColor: alpha(GOLD, 0.3),
                  color: alpha('#F5F0E8', 0.7),
                  '&:hover': {
                    borderColor: GOLD,
                    color: GOLD,
                    bgcolor: alpha(GOLD, 0.06),
                    boxShadow: `0 0 16px ${alpha(GOLD, 0.12)}`,
                  },
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ── How it works ── */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            display="block"
            textAlign="center"
            sx={{ color: GOLD, letterSpacing: '0.2em', mb: 1 }}
          >
            The Process
          </Typography>
          <Typography
            variant="h3"
            textAlign="center"
            mb={8}
            sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8' }}
          >
            How Stiched Works
          </Typography>

          <Grid container spacing={3}>
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <Grid item xs={12} sm={6} md={3} key={step}>
                <Box
                  sx={{
                    p: 3,
                    height: '100%',
                    border: `1px solid ${alpha(GOLD, 0.12)}`,
                    borderRadius: 3,
                    bgcolor: '#111',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      border: `1px solid ${alpha(GOLD, 0.3)}`,
                      boxShadow: `0 8px 32px ${alpha(GOLD, 0.08)}`,
                      transform: 'translateY(-4px)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD_LIGHT})`,
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '3rem',
                      fontWeight: 800,
                      lineHeight: 1,
                      mb: 2,
                      background: `linear-gradient(135deg, ${alpha(GOLD, 0.15)}, ${alpha(GOLD, 0.05)})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontFamily: '"Playfair Display", serif',
                    }}
                  >
                    {step}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    mb={1.5}
                    sx={{ color: '#F5F0E8' }}
                  >
                    {title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: alpha('#F5F0E8', 0.5), lineHeight: 1.7 }}
                  >
                    {desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── CTA: Tailor signup ── */}
      <Box
        sx={{
          py: 10,
          borderTop: `1px solid ${alpha(GOLD, 0.12)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 70% 80% at 50% 50%, ${alpha(GOLD, 0.05)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Scissors icon */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(GOLD, 0.14)} 0%, ${alpha(GOLD, 0.04)} 100%)`,
              border: `1.5px solid ${alpha(GOLD, 0.5)}`,
              mb: 4,
              boxShadow: `0 0 40px ${alpha(GOLD, 0.2)}`,
            }}
          >
            <ContentCut
              sx={{
                fontSize: 36,
                color: GOLD,
                filter: `drop-shadow(0 0 8px ${alpha(GOLD, 0.5)})`,
                transform: 'rotate(-45deg)',
              }}
            />
          </Box>

          <Typography
            variant="h3"
            mb={2}
            sx={{
              fontFamily: '"Playfair Display", serif',
              background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD}, ${GOLD_LIGHT})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Are You a Tailor?
          </Typography>

          <Typography
            variant="h6"
            mb={5}
            sx={{
              color: alpha('#F5F0E8', 0.5),
              fontWeight: 400,
              maxWidth: 480,
              mx: 'auto',
              lineHeight: 1.7,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            List your shop on Stiched and start receiving bookings from customers in
            your city — completely free.
          </Typography>

          <Stack direction="row" justifyContent="center" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/register')}
              sx={{ px: 4 }}
            >
              Register as Tailor
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/tailors')}
              sx={{ px: 4 }}
            >
              Browse Tailors
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer bar */}
      <Box
        sx={{
          py: 3,
          borderTop: `1px solid ${alpha(GOLD, 0.1)}`,
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" sx={{ color: alpha('#F5F0E8', 0.3) }}>
          © 2025 Stiched · Tailored to Perfection
        </Typography>
      </Box>
    </Box>
  );
}
