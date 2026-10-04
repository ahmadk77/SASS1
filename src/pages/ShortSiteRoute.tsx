import React from 'react';
import { useParams, useSearchParams } from 'react-router';
import SiteRenderer from './SiteRenderer';

export default function ShortSiteRoute() {
  const { domain: pathDomain } = useParams();
  const [searchParams] = useSearchParams();
  const queryDomain = searchParams.get('domain');

  const targetDomain = pathDomain || queryDomain;

  if (targetDomain) {
    return <SiteRenderer domain={targetDomain} />;
  }

  return <div>الموقع غير موجود</div>;
}
