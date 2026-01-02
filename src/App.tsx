
import { HashRouter, Route, Routes } from "react-router-dom"
import Navbar from "./navbar"
import { Router } from "./router";
import { AuthProvider } from "./contexts/AuthContext";
  
export function WrappedApp() {
  return (
    <AuthProvider>
      <HashRouter>
        <Navbar />
        <Router />
      </HashRouter>
    </AuthProvider>
  );
}