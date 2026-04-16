import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/components/LoginPage';
import { AdminPage } from '../features/auth/components/AdminPage';
import { AlbumPage } from '../features/album/components/AlbumPage';
import { UploadPage } from '../features/photo/components/UploadPage';
import { GroupPage } from '../features/group/components/GroupPage';
import { BoardPage } from '../features/board/components/BoardPage';

const isAuthenticated = () => !!sessionStorage.getItem('photo_diary_token');

const PrivateRoute = ({ element }: { element: React.ReactElement }) =>
  isAuthenticated() ? element : <Navigate to="/login" replace />;

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/admin" element={<AdminPage />} />
    <Route path="/album" element={<PrivateRoute element={<AlbumPage />} />} />
    <Route path="/upload" element={<PrivateRoute element={<UploadPage />} />} />
    <Route path="/photo-groups" element={<PrivateRoute element={<GroupPage />} />} />
    {/* 掲示板ページ：JWT認証済みユーザーのみアクセス可能 */}
    <Route path="/board" element={<PrivateRoute element={<BoardPage />} />} />
    <Route path="*" element={<Navigate to={isAuthenticated() ? '/album' : '/login'} replace />} />
  </Routes>
);
