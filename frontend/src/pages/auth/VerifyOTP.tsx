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
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f0f23 100%)', p: 2 }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
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
