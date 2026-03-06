
import { HashRouter, Route, Routes } from "react-router-dom"
import Navbar from "./navbar"
import { Router } from "./router";
import { AuthProvider } from "./contexts/AuthContext";
  
export function WrappedApp() {
  return (
    <AuthProvider>
      <HashRouter>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <Navbar />
          <Router />
        </div>
      </HashRouter>
    </AuthProvider>
  );
}