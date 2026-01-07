import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext'; // Import AuthContext to use the hook
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import { ToastContainer } from 'react-toastify';
// NOTE: Ensure 'react-toastify/dist/ReactToastify.css' is imported somewhere globally (e.g., index.css)

// Import Pages
import HomePage from './pages/common/HomePage';
import LoginPage from './pages/common/LoginPage';
import RegisterPage from './pages/common/RegisterPage';
import ServicesPage from './pages/common/ServicesPage';
import SearchResultsPage from './pages/SearchResultsPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import DashboardCustomer from './pages/user/DashboardCustomer';
import ReviewSubmitPage from './pages/user/ReviewSubmitPage';
import DashboardProvider from './pages/provider/DashboardProvider';
import ProviderSettings from './pages/provider/ProviderSettings';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import AboutPage from './pages/common/AboutPage';
import HelpPage from './pages/common/HelpPage';
import HowItWorksPage from './pages/common/HowItWorksPage';
import ChatPage from './pages/common/ChatPage';
import PaymentSuccessPage from './pages/common/PaymentSuccessPage';

// --- NEW IMPORTS ---
import ProfileCompletionPage from './pages/user/ProfileCompletionPage';
import ProviderProfileForm from './components/provider/ProviderProfileForm';


// ------------------------------------------------------------------
// NEW COMPONENT: Profile Check Wrapper
// This component checks if the user is logged in AND if the profile is complete.
// NOTE: Providers are excluded from profile completion check
// ------------------------------------------------------------------
const ProfileCheckWrapper = ({ children }) => {
  const { isAuthenticated, isProfileComplete, loading, user } = useContext(AuthContext);

  if (loading) {
    // Show a simple loading indicator while context loads user status
    return <div className="p-10 text-center">Loading user profile...</div>;
  }

  // 1. If user is logged in AND profile is NOT complete, force redirect to the completion page
  // BUT: Only for customers, not for providers or admins
  if (isAuthenticated && user && !isProfileComplete && user.role === 'customer') {
    return <Navigate to="/profile/complete" replace />;
  }

  // 2. Otherwise (if logged out, or logged in and complete), proceed to children (the main routes)
  return children;
};
// ------------------------------------------------------------------


function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased">
              <Header />
              <main className="flex-grow">
                <Routes>
                  {/* Public Routes (Always Accessible) */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/search" element={<SearchResultsPage />} />
                  <Route path="/service/:id" element={<ServiceDetailPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/payment/success" element={<PaymentSuccessPage />} />

                  {/* Profile Completion Routes */}
                  <Route path="/profile/complete" element={<ProfileCompletionPage />} />
                  <Route path="/provider/profile/setup" element={<ProviderProfileForm />} />

                  {/* Protected Routes */}
                  <Route element={<ProfileCheckWrapper><ProtectedRoute /></ProfileCheckWrapper>}>
                    <Route path="/customer/dashboard" element={<DashboardCustomer />} />
                    <Route path="/review/submit/:bookingId" element={<ReviewSubmitPage />} />
                    <Route path="/provider/dashboard" element={<DashboardProvider />} />
                    <Route path="/provider/settings" element={<ProviderSettings />} />
                    <Route path="/admin/dashboard" element={<DashboardAdmin />} />
                    <Route path="/messages" element={<ChatPage />} />
                  </Route>

                  {/* Fallback 404 Route */}
                  <Route path="*" element={<h1 className="text-center p-10 text-xl">404 Not Found</h1>} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;