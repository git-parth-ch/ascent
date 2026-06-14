import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import App from '../App';

export default function DashboardPage() {
  const location = useLocation();
  const sample = location.state?.sample;
  return <App initialSample={sample} />;
}
