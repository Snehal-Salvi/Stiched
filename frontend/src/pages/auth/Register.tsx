import { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  ToggleButton, ToggleButtonGroup, CircularProgress, Link as MuiLink,
  InputAdornment, IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, DesignServices } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register as registerApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

interface FormData {
  name: string;
  email: string;
  password: string;
}

export default function Register() {
  const [role, setRole] = useState<'customer' | 'tailor'>('customer');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await registerApi({ ...data, role });
      login(res.data.token, res.data.user);
      toast.success(`Welcome to Stiched, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'tailor' ? '/tailor/dashboard' : '/tailors');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Registration failed';
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
          maxWidth: 460,
          width: '100%',
          borderRadius: 2,
          bgcolor: '#111111',
          '&:hover': { transform: 'none' },
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
            <DesignServices color="secondary" fontSize="medium" />
            <Typography variant="h5" fontWeight={800}>Join Stiched</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your account and get started.
          </Typography>

          <Typography variant="caption" color="text.secondary" mb={1} display="block">
            I am a...
          </Typography>
          <ToggleButtonGroup
            value={role}
            exclusive
            onChange={(_, v) => v && setRole(v)}
            fullWidth
            size="small"
            sx={{ mb: 3 }}
          >
            <ToggleButton value="customer">Client</ToggleButton>
            <ToggleButton value="tailor">Tailor</ToggleButton>
          </ToggleButtonGroup>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Full Name"
              fullWidth
              {...register('name', { required: 'Name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              {...register('email', { required: 'Email is required' })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              label="Password"
              type={showPass ? 'text' : 'password'}
              fullWidth
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
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
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              fullWidth
              disabled={loading}
              size="large"
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
            Already have an account?{' '}
            <MuiLink component={Link} to="/login" fontWeight={600}>
              Log in
            </MuiLink>
          </Typography>

          <Box mt={2} textAlign="center">
            <Button
              variant="outlined"
              fullWidth
              href="/api/auth/google"
              sx={{ gap: 1 }}
            >
              <Box component="img" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} />
              Continue with Google
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
