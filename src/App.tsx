/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminEditor from './pages/SuperAdminEditor';
import MyManagements from './pages/MyManagements';
import PaymentSuccess from './components/PaymentSuccess';

import ShortSiteRoute from './pages/ShortSiteRoute';

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/s/:domain" element={<ShortSiteRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute redirectTo="/login"><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute redirectTo="/"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/editor/:tenantId" element={<ProtectedRoute redirectTo="/"><SuperAdminEditor /></ProtectedRoute>} />
            <Route path="/managements" element={<ProtectedRoute redirectTo="/login"><MyManagements /></ProtectedRoute>} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}
