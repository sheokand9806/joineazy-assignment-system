import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import MyGroup from './pages/student/MyGroup.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AssignmentDetail from './pages/admin/AssignmentDetail.jsx';
import AdminGroups from './pages/admin/AdminGroups.jsx';

const home = (user) => (user ? (user.role === 'admin' ? '/admin' : '/student') : '/login');

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={home(user)} replace />;
  return children;
}

function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to={home(user)} replace /> : children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Public><Login /></Public>} />
      <Route path="/register" element={<Public><Register /></Public>} />

      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/student" element={<Protected role="student"><StudentDashboard /></Protected>} />
        <Route path="/student/group" element={<Protected role="student"><MyGroup /></Protected>} />
        <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
        <Route path="/admin/assignments/:id" element={<Protected role="admin"><AssignmentDetail /></Protected>} />
        <Route path="/admin/groups" element={<Protected role="admin"><AdminGroups /></Protected>} />
      </Route>

      <Route path="*" element={<Navigate to={home(user)} replace />} />
    </Routes>
  );
}
