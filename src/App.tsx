
import About from "./pages/About"
import { HashRouter, Route, Routes } from "react-router-dom"
import Contact from "./pages/Contact"
import Projects from "./pages/Projects"
import Navbar from "./navbar"
import Home from "./pages/Home"

export function App() {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
    );
}
  
export function WrappedApp() {
  return (
    <HashRouter>
      <Navbar />
      <App />
    </HashRouter>
  );
}