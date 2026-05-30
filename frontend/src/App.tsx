import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TeachersIndex from './pages/teachers/index';
import TeacherCreate from './pages/teachers/create';
import TeacherEdit from './pages/teachers/edit';
import TeacherShow from './pages/teachers/show';
import StudentsIndex from './pages/students/index';
import StudentCreate from './pages/students/create';
import StudentEdit from './pages/students/edit';
import StudentShow from './pages/students/show';
import SppIndex from './pages/spp/index';
import SppShow from './pages/spp/show';
import SppSettings from './pages/spp/settings';
import UsersIndex from './pages/users/index';
import ClassesIndex from './pages/classes/index';
import ClassShow from './pages/classes/show';
import ClassCreate from './pages/classes/create';
import ClassEdit from './pages/classes/edit';
import CMSIndex from './pages/cms/index';
import CMSCompanyIndex from './pages/cms/company/index';
import CMSCompanyCreate from './pages/cms/company/create';
import CMSCompanyEdit from './pages/cms/company/edit';
import CMSCompanyShow from './pages/cms/company/show';
import CMSBlogIndex from './pages/cms/blog/index';
import CMSBlogCreate from './pages/cms/blog/create';
import CMSBlogEdit from './pages/cms/blog/edit';
import CMSBlogShow from './pages/cms/blog/show';
import CMSNavigationIndex from './pages/cms/navigation/index';
import PPDBIndex from './pages/ppdb/index';
import PPDBCreate from './pages/ppdb/create';
import PPDBShow from './pages/ppdb/show';
import PPDBEdit from './pages/ppdb/edit';
import { AppDialogProvider } from './context/AppDialogContext';
import RoleRoute from './components/RoleRoute';

function DashboardLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppDialogProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected + shared Layout shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route element={<RoleRoute allow={["admin", "kepala_sekolah", "guru"]} />}>
                  <Route path="/" element={<Dashboard />} />
                </Route>

                {/* Teacher Routes */}
                <Route element={<RoleRoute allow={["admin", "kepala_sekolah"]} />}>
                  <Route path="/guru" element={<TeachersIndex />} />
                  <Route path="/guru/create" element={<TeacherCreate />} />
                  <Route path="/guru/:id" element={<TeacherShow />} />
                  <Route path="/guru/:id/edit" element={<TeacherEdit />} />
                </Route>

                {/* Student Routes */}
                <Route element={<RoleRoute allow={["admin", "kepala_sekolah"]} />}>
                  <Route path="/siswa" element={<StudentsIndex />} />
                  <Route path="/siswa/create" element={<StudentCreate />} />
                </Route>
                <Route element={<RoleRoute allow={["admin", "kepala_sekolah", "guru"]} />}>
                  <Route path="/siswa/:id" element={<StudentShow />} />
                  <Route path="/siswa/:id/edit" element={<StudentEdit />} />
                </Route>

                {/* SPP Routes */}
                <Route path="/spp" element={<SppIndex />} />
                <Route path="/spp/:id" element={<SppShow />} />
                <Route element={<RoleRoute allow={["admin", "kepala_sekolah", "guru"]} />}>
                  <Route path="/spp/settings" element={<SppSettings />} />
                </Route>
                {/* Users Route */}
                <Route element={<RoleRoute allow={["admin", "kepala_sekolah"]} />}>
                  <Route path="/users" element={<UsersIndex />} />
                  <Route path="/cms" element={<CMSIndex />} />
                  <Route path="/cms/company" element={<CMSCompanyIndex />} />
                  <Route path="/cms/company/create" element={<CMSCompanyCreate />} />
                  <Route path="/cms/company/:id" element={<CMSCompanyShow />} />
                  <Route path="/cms/company/:id/edit" element={<CMSCompanyEdit />} />
                  <Route path="/cms/blog" element={<CMSBlogIndex />} />
                  <Route path="/cms/blog/create" element={<CMSBlogCreate />} />
                  <Route path="/cms/blog/:id" element={<CMSBlogShow />} />
                  <Route path="/cms/blog/:id/edit" element={<CMSBlogEdit />} />
                  <Route path="/cms/navigation" element={<CMSNavigationIndex />} />
                  <Route path="/ppdb" element={<PPDBIndex />} />
                  <Route path="/ppdb/create" element={<PPDBCreate />} />
                  <Route path="/ppdb/:id" element={<PPDBShow />} />
                  <Route path="/ppdb/:id/edit" element={<PPDBEdit />} />
                </Route>

                {/* Class Routes */}
                <Route element={<RoleRoute allow={["admin", "kepala_sekolah", "guru"]} />}>
                  <Route path="/classes" element={<ClassesIndex />} />
                  <Route path="/classes/:id" element={<ClassShow />} />
                </Route>
                <Route element={<RoleRoute allow={["admin", "kepala_sekolah"]} />}>
                  <Route path="/classes/create" element={<ClassCreate />} />
                  <Route path="/classes/:id/edit" element={<ClassEdit />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AppDialogProvider>
    </AuthProvider>
  );
}

export default App;
