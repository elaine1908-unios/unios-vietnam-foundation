import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { AppLayout } from "./layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
import { AccountPage } from "./pages/AccountPage";
import { ProfilesListPage } from "./pages/ProfilesListPage";
import { ProfileDetailPage } from "./pages/ProfileDetailPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { AuditLogPage } from "./pages/AuditLogPage";
import { EmployeeMasterListPage } from "./pages/EmployeeMasterListPage";
import { EmployeeDetailPage } from "./pages/EmployeeDetailPage";
import { EmployeeEditPage } from "./pages/EmployeeEditPage";
import { EmployeeImportPage } from "./pages/EmployeeImportPage";
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
            {/* The bare domain is the public careers page - it is the advertised URL. */}
            <Route path="/" element={<Navigate to="/careers" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />
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
              <Route path="/profiles" element={<ProfilesListPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route
                path="/profiles/new"
                element={
                  <RequireAuth cap="profile.create">
                    <ProfileEditPage />
                  </RequireAuth>
                }
              />
              <Route path="/profiles/:id" element={<ProfileDetailPage />} />
              <Route
                path="/profiles/:id/edit"
                element={
                  <RequireAuth cap="profile.edit">
                    <ProfileEditPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/users"
                element={
                  <RequireAuth cap="user.admin">
                    <UserManagementPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/audit-log"
                element={
                  <RequireAuth cap="user.admin">
                    <AuditLogPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/employees"
                element={
                  <RequireAuth cap="employee.view">
                    <EmployeeMasterListPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/employees/new"
                element={
                  <RequireAuth cap="employee.create">
                    <EmployeeEditPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/employees/import"
                element={
                  <RequireAuth cap="employee.create">
                    <EmployeeImportPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/employees/:id"
                element={
                  <RequireAuth cap="employee.view">
                    <EmployeeDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/employees/:id/edit"
                element={
                  <RequireAuth cap="employee.edit">
                    <EmployeeEditPage />
                  </RequireAuth>
                }
              />
              {/* Viewable by everyone (careermap.view is universal) — the
                  page itself gates its Add/Edit/Archive controls on
                  careerrole.* capabilities. */}
              <Route path="/career-map" element={<CareerMapPage />} />
              <Route path="/job-descriptions" element={<JobDescriptionsListPage />} />
              <Route
                path="/job-descriptions/new"
                element={
                  <RequireAuth cap="jobdescription.create">
                    <JobDescriptionEditPage />
                  </RequireAuth>
                }
              />
              <Route path="/job-descriptions/:id" element={<JobDescriptionDetailPage />} />
              <Route
                path="/job-descriptions/:id/edit"
                element={
                  <RequireAuth cap="jobdescription.edit">
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
