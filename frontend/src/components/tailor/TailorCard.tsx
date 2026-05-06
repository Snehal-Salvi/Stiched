import {
  Card, CardContent, Box, Typography, Chip, Rating,
  Avatar, Button, Stack, alpha,
} from '@mui/material';
import { LocationOn, CheckCircle, ContentCut } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Tailor } from '../../types';

const GOLD = '#C9A84C';

export default function TailorCard({ tailor }: { tailor: Tailor }) {
  const navigate = useNavigate();
  const cover = tailor.shopPhotos[0]?.image;
  const minPrice = tailor.services.length
    ? Math.min(...tailor.services.map((s) => s.price))
    : null;

  return (
    <Card
      onClick={() => navigate(`/tailors/${tailor._id}`)}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
    >
      {/* Cover */}
      {cover ? (
        <Box
          component="img"
          src={cover}
          alt="shop"
          sx={{ width: '100%', height: 160, objectFit: 'cover' }}
        />
      ) : (
        <Box
          height={160}
          sx={{
            background: `linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 60%, ${alpha(GOLD, 0.12)} 0%, transparent 70%)`,
            },
          }}
        >
          <ContentCut
            sx={{
              fontSize: 52,
              color: alpha(GOLD, 0.5),
              filter: `drop-shadow(0 0 8px ${alpha(GOLD, 0.3)})`,
            }}
          />
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Avatar
            src={tailor.user.avatar}
            sx={{
              width: 32,
              height: 32,
              bgcolor: alpha(GOLD, 0.15),
              color: GOLD,
              fontSize: 14,
              fontWeight: 700,
              border: `1px solid ${alpha(GOLD, 0.3)}`,
            }}
          >
            {tailor.user.name[0]}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ color: '#F5F0E8' }}>
              {tailor.shopName || tailor.user.name}
            </Typography>
          </Box>
          {tailor.isAvailable && (
            <CheckCircle sx={{ fontSize: 15, color: '#4CAF50', flexShrink: 0 }} />
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={0.5} mb={1}>
          <Rating value={tailor.rating} precision={0.5} size="small" readOnly />
          <Typography variant="caption" color="text.secondary">
            ({tailor.totalReviews})
          </Typography>
        </Box>

        {tailor.location.city && (
          <Box display="flex" alignItems="center" gap={0.3} mb={1}>
            <LocationOn sx={{ fontSize: 13, color: alpha(GOLD, 0.5) }} />
            <Typography variant="caption" color="text.secondary">
              {tailor.location.city}{tailor.location.state ? `, ${tailor.location.state}` : ''}
            </Typography>
          </Box>
        )}

        <Stack direction="row" flexWrap="wrap" gap={0.5} mb={1.5}>
          {[...new Set(tailor.services.map((s) => s.category))].slice(0, 2).map((cat) => (
            <Chip
              key={cat}
              label={cat}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.65rem',
                height: 20,
                borderColor: alpha(GOLD, 0.25),
                color: alpha(GOLD, 0.7),
              }}
            />
          ))}
        </Stack>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          {minPrice !== null ? (
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{
                background: `linear-gradient(135deg, #8B6914, ${GOLD})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              From ₹{minPrice}
            </Typography>
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
