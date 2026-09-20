import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './layouts/Layout';
import { Discover } from './pages/Discover';
import { AuthPage } from './pages/Auth';
import { ProjectDetails } from './pages/ProjectDetails';
import { ProjectEditor } from './pages/ProjectEditor';
import { Profile, ProfileEditor } from './pages/Profile';
import { Empty, Loading } from './components/Feedback';
function Protected() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Loading label='Restoring your session…' />;
  return user ? (
    <Outlet />
  ) : (
    <Navigate
      to={`/login?next=${encodeURIComponent(location.pathname)}`}
      replace
    />
  );
}
function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function AppRoutes() {
  const { ready } = useAuth();
  if (!ready) return <Loading label='Opening ProjectHub…' />;
  return (
    <>
      <ScrollReset />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Discover />} />
          <Route path='login' element={<AuthPage key='login' mode='login' />} />
          <Route
            path='register'
            element={<AuthPage key='register' mode='register' />}
          />
          <Route
            path='verify-email'
            element={<AuthPage key='verify' mode='verify-email' />}
          />
          <Route
            path='forgot-password'
            element={<AuthPage key='forgot' mode='forgot-password' />}
          />
          <Route
            path='reset-password'
            element={<AuthPage key='reset' mode='reset-password' />}
          />
          <Route path='projects/:id' element={<ProjectDetails />} />
          <Route path='profile/:username' element={<Profile />} />
          <Route element={<Protected />}>
            <Route path='projects/new' element={<ProjectEditor key='new' />} />
            <Route
              path='projects/:id/edit'
              element={<ProjectEditor key='edit' />}
            />
            <Route path='profile/edit' element={<ProfileEditor />} />
          </Route>
          <Route
            path='*'
            element={
              <div className='container page'>
                <Empty
                  title='This page wandered off.'
                  description='Use Discover to find your next inspiration.'
                  create={false}
                />
              </div>
            }
          />
        </Route>
      </Routes>
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
