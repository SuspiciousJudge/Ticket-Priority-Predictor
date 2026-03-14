import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authAPI, setAuthToken } from '../../services/api';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function ProtectedRoute({ children, roles = [] }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    setAuthToken(token);
    authAPI.getMe().then(res => {
      setUser(res.data.data);
    }).catch(() => {
      setAuthToken(null);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><LoadingSkeleton /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles.length > 0 && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children ? children : <Outlet />;
}
