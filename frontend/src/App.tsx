import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestRoute } from './routes';
import Navbar from './components/common/Navbar';
import PageLoader from './components/common/PageLoader';

const Home = lazy(() => import('./pages/user/Home'));
const Tailors = lazy(() => import('./pages/user/Designers'));
const TailorProfile = lazy(() => import('./pages/user/DesignerProfile'));
const MyOrders = lazy(() => import('./pages/user/MyOrders'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const VerifyOTP = lazy(() => import('./pages/auth/VerifyOTP'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const GoogleCallback = lazy(() => import('./pages/auth/GoogleCallback'));
const TailorDashboard = lazy(() => import('./pages/tailor/Dashboard'));
const TailorProfileEdit = lazy(() => import('./pages/tailor/Profile'));

const Layout = ({ children }: { children: React.ReactNode }) => (
  <Box minHeight="100vh" bgcolor="background.default">
    <Navbar />
    <Box component="main">{children}</Box>
  </Box>
);

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public with layout */}
              <Route element={<Layout><Tailors /></Layout>} path="/tailors" />
              <Route element={<Layout><TailorProfile /></Layout>} path="/tailors/:id" />
              <Route element={<Layout><Home /></Layout>} path="/" />

              {/* Guest-only */}
              <Route element={<GuestRoute />}>
                <Route element={<Login />} path="/login" />
                <Route element={<Register />} path="/register" />
                <Route element={<VerifyOTP />} path="/verify-otp" />
                <Route element={<ForgotPassword />} path="/forgot-password" />
              </Route>

              {/* Google callback — no layout */}
              <Route element={<GoogleCallback />} path="/auth/google" />

              {/* Protected: customer */}
              <Route element={<ProtectedRoute roles={['customer']} />}>
                <Route element={<Layout><MyOrders /></Layout>} path="/user/orders" />
              </Route>

              {/* Protected: tailor */}
              <Route element={<ProtectedRoute roles={['tailor']} />}>
                <Route element={<Layout><TailorDashboard /></Layout>} path="/tailor/dashboard" />
                <Route element={<Layout><TailorProfileEdit /></Layout>} path="/tailor/profile" />
              </Route>
            </Routes>
          </Suspense>

          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss={false}
            theme="light"
          />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
