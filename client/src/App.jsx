import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/useAuth";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AuthorDashboard from "./pages/author/AuthorDashboard";
import MyBooksPage from "./pages/author/MyBooksPage";
import MyTicketsPage from "./pages/author/MyTicketsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TicketQueuePage from "./pages/admin/TicketQueuePage";
import NotFoundPage from "./pages/NotFoundPage";

import AuthorLayout from "./layouts/AuthorLayout";
import AdminLayout from "./layouts/AdminLayout";

function HomeRedirect() {
  const { session } = useAuth();

  if (session?.user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (session?.user?.role === "author") {
    return <Navigate to="/author/dashboard" replace />;
  }

  return <Navigate to="/author/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/author/login" element={<LoginPage audience="author" />} />
      <Route path="/admin/login" element={<LoginPage audience="admin" />} />
      <Route path="/author/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute role="author" />}>
        <Route path="/author" element={<AuthorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AuthorDashboard />} />
          <Route path="books" element={<MyBooksPage />} />
          <Route path="tickets" element={<MyTicketsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tickets" element={<TicketQueuePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
