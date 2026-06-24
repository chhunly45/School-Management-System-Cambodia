import { Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background py-10">
        <div className="max-w-3xl mx-auto rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-red-900">Access Denied</h1>
          <p className="mt-4 text-sm text-red-700">
            You do not have permission to view this page. Only administrators can access admin routes.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition"
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 transition"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminRoute;
