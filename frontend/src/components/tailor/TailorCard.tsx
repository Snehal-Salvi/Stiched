import {
  Card, CardContent, Box, Typography, Chip, Rating,
  Button, Stack, IconButton, Tooltip, alpha,
} from '@mui/material';
import { LocationOn, CheckCircle, ContentCut, Instagram, Facebook, WhatsApp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { Tailor } from '../../types';

const GOLD = '#C9A84C';
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

export default function TailorCard({ tailor }: { tailor: Tailor }) {
  const navigate = useNavigate();
  const cover = tailor.shopPhotos?.[0]?.image;
  const [imgError, setImgError] = useState(false);
  const minPrice = tailor.services.length
    ? Math.min(...tailor.services.map((s) => s.price))
    : null;
  const socialLinks = getSocialLinks(tailor);

  return (
    <Card
      onClick={() => navigate(`/tailors/${tailor._id}`)}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', overflow: 'visible', position: 'relative' }}
    >
      {/* Header band */}
      <Box
        sx={{
          height: 90,
          background: `linear-gradient(135deg, #0D0D0D 0%, #1A1209 60%, ${alpha(GOLD, 0.15)} 100%)`,
          borderRadius: '12px 12px 0 0',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {tailor.isAvailable && (
          <Box sx={{ position: 'absolute', top: 10, right: 12, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle sx={{ fontSize: 13, color: '#4CAF50' }} />
            <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 600, fontSize: '0.65rem' }}>
              Available
            </Typography>
          </Box>
        )}
      </Box>

      {/* Circular image — overlaps header and content */}
      <Box
        sx={{
          position: 'absolute',
          top: 44,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          width: 92,
          height: 92,
          borderRadius: '50%',
          border: `3px solid ${alpha(GOLD, 0.6)}`,
          boxShadow: `0 0 0 3px #121212, 0 0 20px ${alpha(GOLD, 0.25)}`,
          bgcolor: '#0D0D0D',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {cover && !imgError ? (
          <Box
            component="img"
            src={cover}
            alt="shop"
            onError={() => setImgError(true)}
            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <ContentCut sx={{ fontSize: 34, color: alpha(GOLD, 0.5) }} />
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, pt: 7, px: 2, pb: 2, textAlign: 'center' }}>
        <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ color: '#F5F0E8', fontFamily: '"Playfair Display", serif' }}>
          {tailor.shopName || tailor.user?.name || 'Tailor'}
        </Typography>
        {tailor.shopName && tailor.user?.name && (
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
            by {tailor.user.name}
          </Typography>
        )}

        <Box display="flex" justifyContent="center" alignItems="center" gap={0.5} mb={1}>
          <Rating value={tailor.rating} precision={0.5} size="small" readOnly />
          <Typography variant="caption" color="text.secondary">({tailor.totalReviews})</Typography>
        </Box>

        {tailor.location.city && (
          <Box display="flex" justifyContent="center" alignItems="center" gap={0.3} mb={1}>
            <LocationOn sx={{ fontSize: 13, color: alpha(GOLD, 0.5) }} />
            <Typography variant="caption" color="text.secondary">
              {tailor.location.city}{tailor.location.state ? `, ${tailor.location.state}` : ''}
            </Typography>
          </Box>
        )}

        <Stack direction="row" justifyContent="center" gap={0.5} mb={1.5}>
          {[
            { label: 'Instagram', href: socialLinks.instagram, icon: <Instagram fontSize="small" />, color: SOCIAL_COLORS.instagram },
            { label: 'WhatsApp', href: socialLinks.whatsapp, icon: <WhatsApp fontSize="small" />, color: SOCIAL_COLORS.whatsapp },
            { label: 'Facebook', href: socialLinks.facebook, icon: <Facebook fontSize="small" />, color: SOCIAL_COLORS.facebook },
          ].map(({ label, href, icon, color }) => (
            <Tooltip title={label} key={label}>
              <IconButton
                size="small"
                component="a"
                href={href}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                sx={{
                  width: 28,
                  height: 28,
                  color,
                  border: `1px solid ${alpha(color, 0.28)}`,
                  bgcolor: alpha(color, 0.08),
                  '&:hover': { bgcolor: alpha(color, 0.16), borderColor: alpha(color, 0.52) },
                }}
              >
                {icon}
              </IconButton>
            </Tooltip>
          ))}
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={0.5} mb={2} justifyContent="center">
          {[...new Set(tailor.services.map((s) => s.category))].slice(0, 2).map((cat) => (
            <Chip
              key={cat}
              label={cat}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.62rem', height: 20, borderColor: alpha(GOLD, 0.25), color: alpha(GOLD, 0.7) }}
            />
          ))}
        </Stack>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          {minPrice !== null ? (
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ background: `linear-gradient(135deg, #8B6914, ${GOLD})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                From ₹{minPrice}
              </Typography>
              {tailor.services.some((s) => s.priceMayVary) && (
                <Typography variant="caption" color="text.secondary">May vary</Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">No services</Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={(e) => { e.stopPropagation(); navigate(`/tailors/${tailor._id}`); }}
            sx={{ fontSize: '0.75rem', px: 2, py: 0.6 }}
          >
            Book Now
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
