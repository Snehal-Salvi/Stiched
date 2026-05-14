import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  CircularProgress, Alert,
} from '@mui/material';
import { MarkEmailRead } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyOTP } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = state?.email as string | undefined;

  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter a valid 6-digit OTP');
    setLoading(true);
    try {
      const res = await verifyOTP({ email: email!, otp });
      login(res.data.token, res.data.user);
      toast.success('Email verified! Welcome to Stiched.');
      navigate(res.data.user.role === 'tailor' ? '/tailor/dashboard' : '/tailors');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Invalid OTP';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minHeight={{ xs: 'calc(100vh - 68px)', md: 'calc(100vh - 76px)' }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        background: 'linear-gradient(180deg, #080808 0%, #101010 100%)',
        px: 2,
        py: { xs: 4, md: 7 },
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          borderRadius: 2,
          bgcolor: '#111111',
          '&:hover': { transform: 'none' },
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4.5 }, textAlign: 'center' }}>
          <MarkEmailRead sx={{ fontSize: 56, color: 'secondary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} mb={1}>Verify Your Email</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
          </Typography>

          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            Check your inbox (and spam folder).
          </Alert>

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/, '').slice(0, 6))}
              inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: 24, letterSpacing: 8 } }}
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              fullWidth
              disabled={loading || otp.length !== 6}
              size="large"
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Verify'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
