import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import LandingPage        from './pages/LandingPage'
import ProductPage        from './pages/ProductPage'
import HowItWorksPage     from './pages/HowItWorksPage'
import UseCasesPage       from './pages/UseCasesPage'
import ResourcesPage      from './pages/ResourcesPage'
import CompanyPage        from './pages/CompanyPage'
import DashboardPage      from './pages/DashboardPage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<LandingPage />} />
        <Route path="/product"      element={<ProductPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/use-cases"    element={<UseCasesPage />} />
        <Route path="/resources"    element={<ResourcesPage />} />
        <Route path="/company"      element={<CompanyPage />} />
        <Route path="/dashboard"    element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
