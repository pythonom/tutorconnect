import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { TutorSearch } from "./TutorSearch";
import { Dashboard } from "./Dashboard";
import { TutorProfileForm } from "./TutorProfileForm";
import { BookingModal } from "./BookingModal";
import { AvailabilityModal } from "./AvailabilityModal";

import {
  GraduationCap,
  Calendar,
  Search,
  User,
  LogOut,
  Edit,
} from "lucide-react";

type View = "search" | "dashboard" | "profile";

export const MainLayout = () => {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>("search");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);

  const isTutor = user?.role === "tutor";

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-800">
                TutorConnect
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-slate-700 font-medium">{user?.name}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  {isTutor ? "Tutor" : "Learner"}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8 flex-wrap">
          {!isTutor && (
            <button
              onClick={() => setCurrentView("search")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition ${
                currentView === "search"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Search className="w-5 h-5" />
              Find Tutors
            </button>
          )}

          <button
            onClick={() => setCurrentView("dashboard")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition ${
              currentView === "dashboard"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <Calendar className="w-5 h-5" />
            My Sessions
          </button>

          {isTutor && (
            <>
              <button
                onClick={() => setShowProfileForm(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition"
              >
                <Edit className="w-5 h-5" />
                Edit Profile
              </button>

              <button
                onClick={() => setShowAvailability(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition"
              >
                <Calendar className="w-5 h-5" />
                Set Availability
              </button>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          {currentView === "search" && !isTutor && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Find Your Perfect Tutor
              </h2>
              <TutorSearch onSelectTutor={setSelectedTutor} />
            </div>
          )}

          {currentView === "dashboard" && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                {isTutor ? "My Teaching Sessions" : "My Learning Sessions"}
              </h2>
              <Dashboard />
            </div>
          )}

          {currentView === "search" && isTutor && (
            <div className="text-center py-12">
              <p className="text-slate-600">
                View your sessions in the dashboard
              </p>
            </div>
          )}
        </div>
      </div>

      {showProfileForm && (
        <TutorProfileForm onClose={() => setShowProfileForm(false)} />
      )}

      {showAvailability && (
        <AvailabilityModal onClose={() => setShowAvailability(false)} />
      )}

      {selectedTutor && (
        <BookingModal
          tutor={selectedTutor}
          onClose={() => setSelectedTutor(null)}
          onBooked={() => {
            setSelectedTutor(null);
            setCurrentView("dashboard");
          }}
        />
      )}
    </div>
  );
};
