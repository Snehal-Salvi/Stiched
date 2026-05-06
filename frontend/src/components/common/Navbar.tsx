import { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Avatar,
  Menu, MenuItem, Box, Chip, useScrollTrigger, Slide,
  Divider, ListItemIcon, alpha,
} from '@mui/material';
import {
  Dashboard, Person, Logout, Login, HowToReg,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const GOLD = '#C9A84C';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const trigger = useScrollTrigger();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
    setAnchorEl(null);
  };

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      <AppBar position="sticky">
        <Toolbar sx={{ maxWidth: 1200, mx: 'auto', width: '100%', px: { xs: 2, md: 3 } }}>
          {/* Logo */}
          <Box
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'rgba(253, 246, 227, 0.07)',
                borderRadius: '10px',
                px: 1,
                py: 0.5,
                border: `1px solid ${alpha(GOLD, 0.18)}`,
              }}
            >
              <Box
                component="img"
                src="/stiched-logo.png"
                alt="S"
                sx={{ height: { xs: 32, md: 36 }, width: 'auto' }}
              />
              <Box
                component="img"
                src="/stiched.png"
                alt="Stiched"
                sx={{
                  height: { xs: 22, md: 26 },
                  width: 'auto',
                  display: { xs: 'none', sm: 'block' },
                }}
              />
            </Box>
          </Box>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Button
              component={Link}
              to="/tailors"
              sx={{
                color: alpha(GOLD, 0.8),
                fontWeight: 500,
                '&:hover': { color: GOLD, backgroundColor: alpha(GOLD, 0.06) },
              }}
            >
              Find a Tailor
            </Button>

            {!user ? (
              <>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  size="small"
                >
                  Log In
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  color="primary"
                  size="small"
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                {user.role === 'tailor' && (
                  <Button
                    component={Link}
                    to="/tailor/dashboard"
                    startIcon={<Dashboard />}
                    variant="outlined"
                    size="small"
                  >
                    Dashboard
                  </Button>
                )}
                <Chip
                  label={user.role}
                  size="small"
                  sx={{
                    textTransform: 'capitalize',
                    mr: 1,
                    bgcolor: alpha(GOLD, 0.12),
                    color: GOLD,
                    border: `1px solid ${alpha(GOLD, 0.3)}`,
                    fontWeight: 600,
                  }}
                />
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                  <Avatar
                    src={user.avatar}
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: alpha(GOLD, 0.2),
                      color: GOLD,
                      border: `2px solid ${alpha(GOLD, 0.4)}`,
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {user.name[0]}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    sx: {
                      minWidth: 200,
                      borderRadius: 2,
                      mt: 1,
                      bgcolor: '#1A1A1A',
                      border: `1px solid ${alpha(GOLD, 0.2)}`,
                    },
                  }}
                >
                  <MenuItem disabled sx={{ opacity: 1 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {user.email}
                    </Typography>
                  </MenuItem>
                  <Divider />
                  {user.role === 'tailor' ? (
                    [
                      <MenuItem key="dashboard" onClick={() => { navigate('/tailor/dashboard'); setAnchorEl(null); }}>
                        <ListItemIcon><Dashboard fontSize="small" sx={{ color: GOLD }} /></ListItemIcon>
                        Dashboard
                      </MenuItem>,
                      <MenuItem key="profile" onClick={() => { navigate('/tailor/profile'); setAnchorEl(null); }}>
                        <ListItemIcon><Person fontSize="small" sx={{ color: GOLD }} /></ListItemIcon>
                        Shop Profile
                      </MenuItem>,
                    ]
                  ) : (
                    <MenuItem onClick={() => { navigate('/user/orders'); setAnchorEl(null); }}>
                      <ListItemIcon><Person fontSize="small" sx={{ color: GOLD }} /></ListItemIcon>
                      My Orders
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>

          {/* Mobile */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: GOLD }}>
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{ sx: { minWidth: 200, borderRadius: 2, bgcolor: '#1A1A1A', border: `1px solid ${alpha(GOLD, 0.2)}` } }}
            >
              <MenuItem onClick={() => { navigate('/tailors'); setAnchorEl(null); }}>Find a Tailor</MenuItem>
              {!user ? (
                [
                  <MenuItem key="login" onClick={() => { navigate('/login'); setAnchorEl(null); }}>
                    <ListItemIcon><Login fontSize="small" sx={{ color: GOLD }} /></ListItemIcon>Log In
                  </MenuItem>,
                  <MenuItem key="register" onClick={() => { navigate('/register'); setAnchorEl(null); }}>
                    <ListItemIcon><HowToReg fontSize="small" sx={{ color: GOLD }} /></ListItemIcon>Sign Up
                  </MenuItem>,
                ]
              ) : (
                [
                  user.role === 'tailor' && (
                    <MenuItem key="dash" onClick={() => { navigate('/tailor/dashboard'); setAnchorEl(null); }}>
                      <ListItemIcon><Dashboard fontSize="small" sx={{ color: GOLD }} /></ListItemIcon>Dashboard
                    </MenuItem>
                  ),
                  user.role === 'customer' && (
                    <MenuItem key="orders" onClick={() => { navigate('/user/orders'); setAnchorEl(null); }}>
                      <ListItemIcon><Person fontSize="small" sx={{ color: GOLD }} /></ListItemIcon>My Orders
                    </MenuItem>
                  ),
                  <MenuItem key="logout" onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>Logout
                  </MenuItem>,
                ]
              )}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
    </Slide>
  );
}
