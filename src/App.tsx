
import { HashRouter, Route, Routes } from "react-router-dom"
import Navbar from "./navbar"
import { Router } from "./router";
  
export function WrappedApp() {
  return (
    <HashRouter>
      <Navbar />
      <Router />
    </HashRouter>
  );
}