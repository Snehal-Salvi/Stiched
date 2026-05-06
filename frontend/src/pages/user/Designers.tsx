import { useState, useEffect, useCallback } from 'react';
import {
  Container, Grid, Typography, TextField, Box,
  Select, MenuItem, FormControl, InputLabel, Pagination,
  Paper, InputAdornment, Button, Chip, CircularProgress, Alert, alpha,
} from '@mui/material';
import { Search, FilterList, Clear, MyLocation } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { getTailors } from '../../api/tailors';
import type { Tailor } from '../../types';
import { SERVICE_CATEGORIES } from '../../types';
import TailorCard from '../../components/tailor/TailorCard';

const GOLD = '#C9A84C';

export default function Tailors() {
  const [params, setParams] = useSearchParams();
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detecting, setDetecting] = useState(false);

  const [search, setSearch] = useState(params.get('search') || '');
  const [city, setCity] = useState(params.get('city') || '');
  const [serviceCategory, setServiceCategory] = useState(params.get('serviceCategory') || '');
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);

  const fetchTailors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getTailors({
        search: search || undefined,
        city: city || undefined,
        serviceCategory: serviceCategory || undefined,
        minRating: minRating || undefined,
        page,
        limit: 12,
      });
      setTailors(data.tailors);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setError('Failed to load tailors');
    } finally {
      setLoading(false);
    }
  }, [search, city, serviceCategory, minRating, page]);

  useEffect(() => { fetchTailors(); }, [fetchTailors]);

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
          const detected = data.address?.city || data.address?.town || data.address?.village || '';
          setCity(detected);
          setPage(1);
        } catch { /* silent */ } finally { setDetecting(false); }
      },
      () => setDetecting(false)
    );
  };

  const clearFilters = () => {
    setSearch(''); setCity(''); setServiceCategory(''); setMinRating(0); setPage(1);
    setParams({});
  };

  const hasFilters = search || city || serviceCategory || minRating > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography
          variant="h4"
          fontWeight={700}
          mb={0.5}
          sx={{ fontFamily: '"Playfair Display", serif', color: '#F5F0E8' }}
        >
          Find a Tailor
        </Typography>
        <Typography color="text.secondary">Browse skilled tailors in your city</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2.5,
              borderRadius: 3,
              position: 'sticky',
              top: 80,
              bgcolor: '#111',
              border: `1px solid ${alpha(GOLD, 0.15)}`,
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <FilterList fontSize="small" sx={{ color: alpha(GOLD, 0.7) }} />
                <Typography fontWeight={600}>Filters</Typography>
              </Box>
              {hasFilters && (
                <Button size="small" startIcon={<Clear />} onClick={clearFilters} color="error" sx={{ fontSize: '0.75rem' }}>
                  Clear
                </Button>
              )}
            </Box>

            <TextField
              label="Search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              fullWidth size="small" sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: alpha(GOLD, 0.5) }} /></InputAdornment> }}
            />

            <Box display="flex" gap={1} mb={2}>
              <TextField
                label="City"
                value={city}
                onChange={(e) => { setCity(e.target.value); setPage(1); }}
                size="small" fullWidth
              />
              <Button
                size="small" variant="outlined" onClick={detectCity} disabled={detecting}
                sx={{ flexShrink: 0, minWidth: 0, px: 1 }}
              >
                {detecting ? <CircularProgress size={14} sx={{ color: GOLD }} /> : <MyLocation fontSize="small" />}
              </Button>
            </Box>

            <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
              <InputLabel>Service Type</InputLabel>
              <Select value={serviceCategory} label="Service Type"
                onChange={(e) => { setServiceCategory(e.target.value); setPage(1); }}>
                <MenuItem value="">All Services</MenuItem>
                {SERVICE_CATEGORIES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>

            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={1}>
              Min Rating
            </Typography>
            <Box display="flex" gap={0.5} flexWrap="wrap">
              {[0, 3, 4, 4.5].map((r) => (
                <Chip
                  key={r}
                  label={r === 0 ? 'Any' : `${r}★`}
                  size="small"
                  clickable
                  onClick={() => { setMinRating(r); setPage(1); }}
                  sx={{
                    fontSize: '0.7rem',
                    bgcolor: minRating === r ? alpha(GOLD, 0.15) : 'transparent',
                    color: minRating === r ? GOLD : 'text.secondary',
                    borderColor: minRating === r ? alpha(GOLD, 0.5) : alpha(GOLD, 0.15),
                    border: '1px solid',
                  }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={9}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography color="text.secondary" variant="body2">
              {loading ? 'Searching...' : `${total} tailor${total !== 1 ? 's' : ''} found${city ? ` in ${city}` : ''}`}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress sx={{ color: GOLD }} />
            </Box>
          ) : tailors.length === 0 ? (
            <Box
              textAlign="center"
              py={10}
              sx={{
                border: `1px solid ${alpha(GOLD, 0.12)}`,
                borderRadius: 3,
                bgcolor: '#111',
              }}
            >
              <Typography variant="h6" color="text.secondary" mb={1}>No tailors found</Typography>
              <Typography color="text.secondary" mb={3} variant="body2">
                Try a different city or clear your filters
              </Typography>
              <Button onClick={clearFilters} variant="outlined">Clear Filters</Button>
            </Box>
          ) : (
            <>
              <Grid container spacing={2}>
                {tailors.map((t) => (
                  <Grid item xs={12} sm={6} lg={4} key={t._id}>
                    <TailorCard tailor={t} />
                  </Grid>
                ))}
              </Grid>
              {pages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination count={pages} page={page} onChange={(_, p) => setPage(p)} />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
