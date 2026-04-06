import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Toast from './components/common/Toast';

// Lazy load pages for route-level code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TicketList = lazy(() => import('./pages/TicketList'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));
const CreateTicket = lazy(() => import('./pages/CreateTicket'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Team = lazy(() => import('./pages/Team'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Landing = lazy(() => import('./pages/Landing'));

// All the missing page imports
const Inbox = lazy(() => import('./pages/Inbox'));
const MyTickets = lazy(() => import('./pages/MyTickets'));
const UnassignedTickets = lazy(() => import('./pages/UnassignedTickets'));
const UrgentTickets = lazy(() => import('./pages/UrgentTickets'));
const SavedViews = lazy(() => import('./pages/SavedViews'));
const Performance = lazy(() => import('./pages/Performance'));
const Reports = lazy(() => import('./pages/Reports'));
const NotificationsCenter = lazy(() => import('./pages/NotificationsCenter'));
const ActivityLog = lazy(() => import('./pages/ActivityLog'));
const Customers = lazy(() => import('./pages/Customers'));
const CalendarSchedule = lazy(() => import('./pages/CalendarSchedule'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const Automations = lazy(() => import('./pages/Automations'));
const Integrations = lazy(() => import('./pages/Integrations'));
const SLAManagement = lazy(() => import('./pages/SLAManagement'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toast />
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="tickets" element={<TicketList />} />
              <Route path="tickets/:id" element={<TicketDetail />} />
              <Route path="create" element={<CreateTicket />} />
              <Route path="my-tickets" element={<MyTickets />} />
              <Route path="unassigned" element={<UnassignedTickets />} />
              <Route path="urgent" element={<UrgentTickets />} />
              <Route path="saved-views" element={<SavedViews />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="performance" element={<Performance />} />
              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<NotificationsCenter />} />
              <Route path="activity-log" element={<ActivityLog />} />
              <Route path="customers" element={<Customers />} />
              <Route path="calendar" element={<CalendarSchedule />} />
              <Route path="knowledge-base" element={<KnowledgeBase />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="automations" element={<Automations />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="sla" element={<SLAManagement />} />
              <Route path="help" element={<HelpSupport />} />
              <Route path="team" element={<Team />} />
              <Route path="team/manage" element={<Team />} />
              <Route path="settings" element={<Settings />} />
              {/* Catch-all redirect to Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;