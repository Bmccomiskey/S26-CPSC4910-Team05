import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth(requiredRole = null) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    const id = localStorage.getItem('userId');

    if (!role) {
      navigate('/login');
      setLoading(false);
      return;
    }

    if (requiredRole && role !== requiredRole && role !== 'admin') {
      if (role === 'sponsor') navigate('/sponsor-dashboard');
      else navigate('/driver-dashboard');
      setLoading(false);
      return;
    }

    setUser({ role, email, id: id ? parseInt(id) : null });
    setLoading(false);
  }, []);

  return { user, loading };
}