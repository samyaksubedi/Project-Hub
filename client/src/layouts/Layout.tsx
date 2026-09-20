import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Plus, ArrowUpRight, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Avatar } from "../components/Avatar";
import { ErrorMessage } from "../components/Feedback";
export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="ProjectHub home">
      <span className="logo-mark" aria-hidden="true">
        P/H
      </span>
      <span className="logo-type">ProjectHub</span>
    </Link>
  );
}
export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await logout();
      navigate("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          <nav className="main-nav">
            <NavLink to="/" end>
              Discover
            </NavLink>
            {user && (
              <NavLink to={`/profile/${user.username}`}>My projects</NavLink>
            )}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <Link
                  className="user-link"
                  to={`/profile/${user.username}`}
                  aria-label="Your profile"
                >
                  <Avatar user={user} />
                </Link>
                <button
                  className="icon-button logout"
                  title="Log out"
                  aria-label="Log out"
                  disabled={busy}
                  onClick={() => void signOut()}
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <Link className="login-link" to="/login">
                Log in <ArrowUpRight size={14} />
              </Link>
            )}
            <Link className="button primary" to="/projects/new" aria-label="Share a project">
              <Plus size={17} />
              <span>Share a project</span>
            </Link>
          </div>
        </div>
      </header>
      {error && (
        <div className="container">
          <ErrorMessage message={error} />
        </div>
      )}
      <main id="main-content">
        <Outlet />
      </main>
    </>
  );
}