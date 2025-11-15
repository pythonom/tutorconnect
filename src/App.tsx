// import { AuthProvider, useAuth } from "./contexts/AuthContext";
// import { Auth } from "./components/Auth";
// import { MainLayout } from "./components/MainLayout";

// function AppContent() {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
//         <div className="text-slate-600 text-lg">Loading...</div>
//       </div>
//     );
//   }

//   return user ? <MainLayout /> : <Auth />;
// }

// function App() {
//   return (
//     <AuthProvider>
//       <AppContent />
//     </AuthProvider>
//   );
// }

// export default App;
/*
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Auth } from "./components/Auth";
import { MainLayout } from "./components/MainLayout";
import { ProtectedRoute } from "./components/protectedRoute";
// import { Dashboard as TutorDashboard } from "./components/Dashboard";
// import { Dashboard as LearnerDashboard } from "./components/Dashboard";

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<Auth />} />

        {* ✅ Wrap dashboards with MainLayout *}

        <Route
          path="/tutor-dashboard"
          element={
            <ProtectedRoute>
              <>
                <MainLayout /> {//* contains header + dashboard logic *}
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/learner-dashboard"
          element={
            <ProtectedRoute>
              <>
                <MainLayout /> {//* same layout, but learner view *}
              </>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
  //   <Routes>
  //     {//* Auth/Login page *}
  //     <Route
  //       path="/"
  //       element={!user ? <Auth /> : <Navigate to={`/${user.role}-dashboard`} />}
  //     />

  //     {//* Tutor Dashboard (protected & role-based) *}
  //     <Route
  //       path="/tutor-dashboard"
  //       element={
  //         <ProtectedRoute>
  //           {user?.role === "tutor" ? (
  //             <TutorDashboard />
  //           ) : (
  //             <Navigate to="/learner-dashboard" />
  //           )}
  //         </ProtectedRoute>
  //       }
  //     />

  //     {//* Learner Dashboard (protected & role-based) *}
  //     <Route
  //       path="/learner-dashboard"
  //       element={
  //         <ProtectedRoute>
  //           {user?.role === "learner" ? (
  //             <LearnerDashboard />
  //           ) : (
  //             <Navigate to="/tutor-dashboard" />
  //           )}
  //         </ProtectedRoute>
  //       }
  //     />

  //     {//* Fallback for invalid routes *}
  //     <Route path="*" element={<Navigate to="/" />} />
  //   </Routes>
  // );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
*/

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Auth } from "./components/Auth";
import { MainLayout } from "./components/MainLayout";
import { ProtectedRoute } from "./components/protectedRoute";

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<Auth />} />

      {/* ✅ Tutor Dashboard */}
      <Route
        path="/tutor-dashboard"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      />

      {/* ✅ Learner Dashboard */}
      <Route
        path="/learner-dashboard"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
