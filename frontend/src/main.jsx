import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import { ThemeProvider } from './context/ThemeContext'
import LandingPage    from './pages/LandingPage'
import ProductPage    from './pages/ProductPage'
import HowItWorksPage from './pages/HowItWorksPage'
import UseCasesPage   from './pages/UseCasesPage'
import ResourcesPage  from './pages/ResourcesPage'
import CompanyPage    from './pages/CompanyPage'
import DashboardPage  from './pages/DashboardPage'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'sans-serif', background: '#FAF7F2', color: '#1A1208' }}>
          <p style={{ fontWeight: 700, fontSize: 18 }}>Something went wrong.</p>
          <pre style={{ fontSize: 12, color: '#888', maxWidth: 600, whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', borderRadius: 9999, background: '#E8521A', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
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
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
