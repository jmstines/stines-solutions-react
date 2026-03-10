import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Chat from "./pages/Chat";
import ChangePassword from "./pages/ChangePassword";
import UserAdmin from "./pages/UserAdmin";
import TicTacToe from "./pages/games/TicTacToe";
import ProtectedRoute from "./components/ProtectedRoute";
import './styles.css'

export function Router() {
    const location = useLocation();
    const isFullWidth = location.pathname === '/chat';

    return (
      <div className={isFullWidth ? 'page-fill-height' : 'main-container'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/change-password" 
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <UserAdmin />
              </ProtectedRoute>
            }
          />
          <Route path="/games/tic-tac-toe" element={<TicTacToe />} />
        </Routes>
      </div>
    );
}