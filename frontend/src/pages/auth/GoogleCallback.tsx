import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMe } from '../../api/auth';
import PageLoader from '../../components/common/PageLoader';
import { toast } from 'react-toastify';

export default function GoogleCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (!token) { navigate('/login'); return; }
    localStorage.setItem('token', token);
    getMe()
      .then(({ data }) => {
        login(token, data);
        toast.success(`Welcome, ${data.name}!`);
        navigate(data.role === 'tailor' ? '/tailor/dashboard' : '/tailors');
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [params, login, navigate]);

  return <PageLoader />;
}
