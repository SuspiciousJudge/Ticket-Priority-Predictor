import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import CreateTicket from './pages/CreateTicket';
import Analytics from './pages/Analytics';
import Team from './pages/Team';
import Settings from './pages/Settings';
import MyTickets from './pages/MyTickets';
import UnassignedTickets from './pages/UnassignedTickets';
import UrgentTickets from './pages/UrgentTickets';
import Reports from './pages/Reports';
import Performance from './pages/Performance';
import NotificationsCenter from './pages/NotificationsCenter';
import KnowledgeBase from './pages/KnowledgeBase';
import Customers from './pages/Customers';
import CalendarSchedule from './pages/CalendarSchedule';
import ActivityLog from './pages/ActivityLog';
import TemplatesPage from './pages/TemplatesPage';
import Automations from './pages/Automations';
import Integrations from './pages/Integrations';
import SLAManagement from './pages/SLAManagement';
import HelpSupport from './pages/HelpSupport';
import SavedViews from './pages/SavedViews';
import InboxPage from './pages/Inbox';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Landing from './pages/Landing';
import Toast from './components/common/Toast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorOverlay from './components/common/ErrorOverlay';
import { getStoredToken } from './services/api';
import { useParams } from 'react-router-dom';

function AuthPageRedirect({ children }) {
  const token = getStoredToken();
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function TicketDetailRoute() {
  const { id } = useParams();
  return <TicketDetail key={id} />;
}

function App() {
  return (
    <BrowserRouter>
      <ErrorOverlay />
      <Toast />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />

        <Route path="/login" element={<AuthPageRedirect><Login /></AuthPageRedirect>} />
        <Route path="/signup" element={<AuthPageRedirect><SignUp /></AuthPageRedirect>} />
        <Route path="/forgot-password" element={<AuthPageRedirect><ForgotPassword /></AuthPageRedirect>} />
        <Route path="/reset-password" element={<AuthPageRedirect><ResetPassword /></AuthPageRedirect>} />

        <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
        <Route path="/inbox" element={<ProtectedPage><InboxPage /></ProtectedPage>} />
        <Route path="/inbox-email" element={<Navigate to="/inbox" replace />} />
        <Route path="/tickets" element={<ProtectedPage><TicketList /></ProtectedPage>} />
        <Route path="/tickets/:id" element={<ProtectedPage><TicketDetailRoute /></ProtectedPage>} />
        <Route path="/create" element={<ProtectedPage><CreateTicket /></ProtectedPage>} />
        <Route path="/create-ticket" element={<Navigate to="/create" replace />} />
        <Route path="/my-tickets" element={<ProtectedPage><MyTickets /></ProtectedPage>} />
        <Route path="/mytickets" element={<Navigate to="/my-tickets" replace />} />
        <Route path="/unassigned" element={<ProtectedPage><UnassignedTickets /></ProtectedPage>} />
        <Route path="/unassigned-tickets" element={<Navigate to="/unassigned" replace />} />
        <Route path="/urgent" element={<ProtectedPage><UrgentTickets /></ProtectedPage>} />
        <Route path="/high-priority" element={<Navigate to="/urgent" replace />} />
        <Route path="/urgent-tickets" element={<Navigate to="/urgent" replace />} />
        <Route path="/saved-views" element={<ProtectedPage><SavedViews /></ProtectedPage>} />
        <Route path="/saved-filters" element={<Navigate to="/saved-views" replace />} />
        <Route path="/saved-filters-views" element={<Navigate to="/saved-views" replace />} />
        <Route path="/analytics" element={<ProtectedPage><Analytics /></ProtectedPage>} />
        <Route path="/reports" element={<ProtectedPage><Reports /></ProtectedPage>} />
        <Route path="/performance" element={<ProtectedPage><Performance /></ProtectedPage>} />
        <Route path="/activity-log" element={<ProtectedPage><ActivityLog /></ProtectedPage>} />
        <Route path="/activity" element={<Navigate to="/activity-log" replace />} />
        <Route path="/audit-log" element={<Navigate to="/activity-log" replace />} />
        <Route path="/notifications" element={<ProtectedPage><NotificationsCenter /></ProtectedPage>} />
        <Route path="/notifications-center" element={<Navigate to="/notifications" replace />} />
        <Route path="/customers" element={<ProtectedPage><Customers /></ProtectedPage>} />
        <Route path="/calendar" element={<ProtectedPage><CalendarSchedule /></ProtectedPage>} />
        <Route path="/knowledge-base" element={<ProtectedPage><KnowledgeBase /></ProtectedPage>} />
        <Route path="/knowledge" element={<Navigate to="/knowledge-base" replace />} />
        <Route path="/templates" element={<ProtectedPage><TemplatesPage /></ProtectedPage>} />
        <Route path="/automations" element={<ProtectedPage><Automations /></ProtectedPage>} />
        <Route path="/workflows" element={<Navigate to="/automations" replace />} />
        <Route path="/integrations" element={<ProtectedPage><Integrations /></ProtectedPage>} />
        <Route path="/sla" element={<ProtectedPage><SLAManagement /></ProtectedPage>} />
        <Route path="/sla-management" element={<Navigate to="/sla" replace />} />
        <Route path="/help" element={<ProtectedPage><HelpSupport /></ProtectedPage>} />
        <Route path="/help-support" element={<Navigate to="/help" replace />} />
        <Route path="/team" element={<ProtectedPage><Team /></ProtectedPage>} />
        <Route path="/team/manage" element={<Navigate to="/team" replace />} />
        <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;