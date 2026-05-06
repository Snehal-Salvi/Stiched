import { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  CircularProgress, Link as MuiLink, Stepper, Step, StepLabel,
  InputAdornment, IconButton,
} from '@mui/material';
import { LockReset, Visibility, VisibilityOff } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { forgotPassword, resetPassword } from '../../api/auth';

export default function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success('OTP sent to your email');
      setStep(1);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await resetPassword({ email, otp, newPassword });
      toast.success('Password reset! Please log in.');
      navigate('/login');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed');
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
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <LockReset color="secondary" fontSize="large" />
            <Typography variant="h5" fontWeight={700}>Reset Password</Typography>
          </Box>

          <Stepper activeStep={step} sx={{ mb: 3 }}>
            <Step><StepLabel>Email</StepLabel></Step>
            <Step><StepLabel>Reset</StepLabel></Step>
          </Stepper>

          {step === 0 ? (
            <Box component="form" onSubmit={handleSendOTP} display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
              />
              <Button type="submit" variant="contained" color="secondary" fullWidth disabled={loading} size="large">
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Send OTP'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleReset} display="flex" flexDirection="column" gap={2}>
              <TextField
                label="OTP Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/, '').slice(0, 6))}
                fullWidth
                inputProps={{ style: { letterSpacing: 6 } }}
              />
              <TextField
                label="New Password"
                type={showPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass((p) => !p)} edge="end">
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" color="secondary" fullWidth disabled={loading} size="large">
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Reset Password'}
              </Button>
            </Box>
          )}

          <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
            <MuiLink component={Link} to="/login" fontWeight={600}>Back to Login</MuiLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
