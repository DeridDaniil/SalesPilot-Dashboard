import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import ForcePasswordModal from './ForcePasswordModal';

export default function ProtectedRoute() {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      {user.temporaryPassword && <ForcePasswordModal />}
      <Outlet />
    </>
  );
}
