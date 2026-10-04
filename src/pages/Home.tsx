import React from 'react';
import { useSearchParams } from 'react-router';
import SiteRenderer from './SiteRenderer';
import LandingPage from './LandingPage';

export default function Home() {
  const [searchParams] = useSearchParams();
  const paramDomain = searchParams.get('domain');
  
  const hostname = window.location.hostname.toLowerCase().trim();
  const isBaseDomain = 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' ||
    hostname.includes('run.app') || 
    hostname.includes('ai.studio') || 
    hostname === 'sass-gyis.onrender.com' ||
    hostname === 'www.sass-gyis.onrender.com' ||
    hostname === 'bunyan.website' ||
    hostname === 'www.bunyan.website' ||
    (hostname.endsWith('.onrender.com') && hostname.split('.').length === 3);
  
  let domain = paramDomain;
  if (!domain && !isBaseDomain) {
    if (hostname.endsWith('.sass-gyis.onrender.com')) {
      domain = hostname.replace('.sass-gyis.onrender.com', '');
    } else if (hostname.endsWith('.bunyan.website')) {
      domain = hostname.replace('.bunyan.website', '');
    } else {
      domain = hostname;
    }
  }

  if (domain) {
    const cleanDomain = domain.replace(/^www\./i, '');
    return <SiteRenderer domain={cleanDomain} />;
  }
  return <LandingPage />;
}
