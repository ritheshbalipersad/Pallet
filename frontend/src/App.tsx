import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/useAuth';
import { useOnlineSync } from './offline/sync';
import Layout from './layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scan from './pages/Scan';
import PalletDetail from './pages/PalletDetail';
import AddPallet from './pages/AddPallet';
import MoveOut from './pages/MoveOut';
import ConfirmIn from './pages/ConfirmIn';
import Areas from './pages/admin/Areas';
import Users from './pages/admin/Users';
import AuditLog from './pages/admin/AuditLog';
import Reports from './pages/Reports';
import Exports from './pages/Exports';

function Protected({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function SyncOnOnline() {
  useOnlineSync((synced, failed) => {
    if (synced > 0 || failed > 0) window.dispatchEvent(new CustomEvent('offline-sync-done', { detail: { synced, failed } }));
  });
  return null;
}

export default function App() {
  return (
    <AuthProvider>
    <SyncOnOnline />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="scan" element={<Scan />} />
        <Route path="pallet/:id" element={<PalletDetail />} />
        <Route path="add-pallet" element={<AddPallet />} />
        <Route path="move-out" element={<MoveOut />} />
        <Route path="confirm-in" element={<ConfirmIn />} />
        <Route path="reports" element={<Reports />} />
        <Route path="exports" element={<Exports />} />
        <Route path="admin/areas" element={<Areas />} />
        <Route path="admin/users" element={<Users />} />
        <Route path="admin/audit" element={<AuditLog />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AuthProvider>
  );
}
