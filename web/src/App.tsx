import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { AppLayout } from "./layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { ProfilesListPage } from "./pages/ProfilesListPage";
import { ProfileDetailPage } from "./pages/ProfileDetailPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { CareerMapPage } from "./pages/CareerMapPage";
import { JobDescriptionsListPage } from "./pages/JobDescriptionsListPage";
import { JobDescriptionDetailPage } from "./pages/JobDescriptionDetailPage";
import { JobDescriptionEditPage } from "./pages/JobDescriptionEditPage";
import { PublicLayout } from "./layout/PublicLayout";
import { PublicCareersListPage } from "./pages/public/PublicCareersListPage";
import { PublicJobDescriptionPage } from "./pages/public/PublicJobDescriptionPage";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<PublicLayout />}>
              <Route path="/careers" element={<PublicCareersListPage />} />
              <Route path="/careers/:id" element={<PublicJobDescriptionPage />} />
            </Route>
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<ProfilesListPage />} />
              <Route
                path="/profiles/new"
                element={
                  <RequireAuth teamLeadOnly>
                    <ProfileEditPage />
                  </RequireAuth>
                }
              />
              <Route path="/profiles/:id" element={<ProfileDetailPage />} />
              <Route
                path="/profiles/:id/edit"
                element={
                  <RequireAuth teamLeadOnly>
                    <ProfileEditPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/users"
                element={
                  <RequireAuth teamLeadOnly>
                    <UserManagementPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/career-map"
                element={
                  <RequireAuth teamLeadOnly>
                    <CareerMapPage />
                  </RequireAuth>
                }
              />
              <Route path="/job-descriptions" element={<JobDescriptionsListPage />} />
              <Route
                path="/job-descriptions/new"
                element={
                  <RequireAuth teamLeadOnly>
                    <JobDescriptionEditPage />
                  </RequireAuth>
                }
              />
              <Route path="/job-descriptions/:id" element={<JobDescriptionDetailPage />} />
              <Route
                path="/job-descriptions/:id/edit"
                element={
                  <RequireAuth teamLeadOnly>
                    <JobDescriptionEditPage />
                  </RequireAuth>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
