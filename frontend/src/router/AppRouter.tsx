import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/components/LoginPage';
import { AlbumPage } from '../features/album/components/AlbumPage';
import { UploadPage } from '../features/photo/components/UploadPage';
import { GroupPage } from '../features/group/components/GroupPage';

const isAuthenticated = () => !!sessionStorage.getItem('photo_diary_token');

const PrivateRoute = ({ element }: { element: React.ReactElement }) =>
  isAuthenticated() ? element : <Navigate to="/login" replace />;

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/album" element={<PrivateRoute element={<AlbumPage />} />} />
    <Route path="/upload" element={<PrivateRoute element={<UploadPage />} />} />
    <Route path="/photo-groups" element={<PrivateRoute element={<GroupPage />} />} />
    <Route path="*" element={<Navigate to={isAuthenticated() ? '/album' : '/login'} replace />} />
  </Routes>
);
