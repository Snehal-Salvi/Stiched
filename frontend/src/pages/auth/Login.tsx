import { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  CircularProgress, Link as MuiLink, InputAdornment, IconButton, Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, DesignServices } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login as loginApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

interface FormData {
  email: string;
  password: string;
}

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await loginApi(data);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'tailor' ? '/tailor/dashboard' : '/tailors');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Login failed';
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
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <DesignServices color="secondary" fontSize="large" />
            <Typography variant="h5" fontWeight={800}>Welcome back</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Sign in to your Stiched account
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              autoComplete="email"
              {...register('email', { required: 'Email is required' })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              label="Password"
              type={showPass ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              {...register('password', { required: 'Password is required' })}
              error={!!errors.password}
              helperText={errors.password?.message}
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
            <Box textAlign="right" mt={-1}>
              <MuiLink component={Link} to="/forgot-password" variant="body2" fontWeight={600}>
                Forgot password?
              </MuiLink>
            </Box>
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              fullWidth
              disabled={loading}
              size="large"
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>or</Divider>

          <Button
            variant="outlined"
            fullWidth
            href="/api/auth/google"
            sx={{ gap: 1 }}
          >
            <Box component="img" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} />
            Continue with Google
          </Button>

          <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
            Don't have an account?{' '}
            <MuiLink component={Link} to="/register" fontWeight={600}>
              Sign up
            </MuiLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
