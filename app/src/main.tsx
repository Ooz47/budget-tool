import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from "react-router-dom";
import { ActiveAccountProvider } from "./context/ActiveAccountContext";
import App from './App.tsx'
console.log("API base =", import.meta.env.VITE_API_BASE);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ActiveAccountProvider>    <App /></ActiveAccountProvider>

    </BrowserRouter>
    
  </StrictMode>,
)
