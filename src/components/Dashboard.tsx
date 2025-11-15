import { useState, useEffect } from "react";
// import { Session, Profile } from '../lib/supabase';
import { useAuth } from "../contexts/AuthContext";
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  Video,
} from "lucide-react";
import { ReviewModal } from "./ReviewModal";

// interface SessionWithProfiles extends Session {
//   tutor: Profile;
//   learner: Profile;
// }
interface CustomUser {
  id: string;
  email: string;
  name?: string;
  role: "tutor" | "learner";
}

interface Session {
  id: number;
  subject: string;
  scheduled_at: string;
  duration_minutes: number;
  session_type: string;
  status: string;
  notes?: string;
  tutor_id?: string;
  learner_id?: string;
  tutor_name?: string;
  learner_name?: string;
  tutor_email?: string;
  learner_email?: string;
  tutor?: { full_name?: string; email?: string };
  learner?: { full_name?: string; email?: string };
  meeting_link?: string;
  created_at: string;
  updated_at: string;
}

type SessionWithProfiles = Session;

type FilterType = "all" | "pending" | "confirmed" | "completed";

export const Dashboard = () => {
  const { user } = useAuth() as { user: CustomUser | null };
  const [sessions, setSessions] = useState<SessionWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const isTutor = user?.role === "tutor";

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, filter]);

  const loadSessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const endpoint = isTutor
        ? "http://127.0.0.1:8000/api/sessions/tutor"
        : "http://127.0.0.1:8000/api/sessions/me";
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load sessions");
      const data = await res.json();

      const filtered =
        filter === "all"
          ? data
          : data.filter((s: Session) => s.status === filter);
      setSessions(filtered);
    } catch (err) {
      console.error("Error loading sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStatus = async (
    sessionId: string | number,
    status: string
  ) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://127.0.0.1:8000/api/sessions/${sessionId}?status=${status}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to update session");

      loadSessions();
    } catch (err) {
      console.error("Error updating session:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-slate-600">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap">
        {["all", "pending", "confirmed", "completed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as FilterType)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {sessions.map((session) => {
          const otherPerson = isTutor
            ? session.learner_name
            : session.tutor_name;
          const isCompleted = session.status === "completed";
          const canReview = !isTutor && isCompleted;

          return (
            <div
              key={session.id}
              className="bg-white rounded-xl shadow-md border border-slate-200 p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        {session.subject}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">
                          {isTutor ? "Student" : "Tutor"}:{" "}
                          {otherPerson || "Unknown"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {session.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(session.scheduled_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {session.duration_minutes} minutes
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {session.session_type}
                    </div>
                  </div>

                  {session.notes && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700">{session.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex lg:flex-col gap-2">
                  {isTutor && session.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          updateSessionStatus(session.id, "confirmed")
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          updateSessionStatus(session.id, "cancelled")
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </button>
                    </>
                  )}

                  {session.status === "confirmed" && (
                    <button
                      onClick={() =>
                        updateSessionStatus(session.id, "completed")
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      <Video className="w-4 h-4" />
                      Mark Complete
                    </button>
                  )}

                  {canReview && (
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Leave Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-slate-600">No sessions found</p>
          </div>
        )}
      </div>

      {selectedSession && (
        <ReviewModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onReviewed={loadSessions}
        />
      )}
    </div>
  );
};
