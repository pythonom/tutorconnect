import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { X, Calendar, Clock } from "lucide-react";
import { API } from "../lib/api";

interface TutorInfo {
  id: number;
  name: string;
  bio: string;
  skills: string[];
}

const SESSION_TYPE_MAP = {
  "1-on-1": "online",
  group: "offline",
} as const;

export const BookingModal = ({
  tutor,
  onClose,
  onBooked,
}: {
  tutor: TutorInfo;
  onClose: () => void;
  onBooked: () => void;
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    session_type: "1-on-1" as "1-on-1" | "group",
    scheduled_at: "",
    duration_minutes: 60,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/sessions/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          tutor_id: Number(tutor.id),
          subject: formData.subject,
          session_type: SESSION_TYPE_MAP[formData.session_type],
          scheduled_at: formData.scheduled_at,
          duration_minutes: formData.duration_minutes,
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to book session");
      }

      onBooked();
      onClose();
    } catch (error) {
      console.error("Error booking session:", error);
      // console.log("Token being sent:", localStorage.getItem("token"));
      alert("Failed to book session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ">
      <div className="bg-white rounded-4xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-4">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Book a Session
            </h2>
            <p className="text-slate-600 mt-1">with {tutor.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subject / Topic
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="e.g., Calculus, Python Programming"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Session Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, session_type: "1-on-1" })
                }
                className={`py-2 px-4 rounded-lg font-medium transition ${
                  formData.session_type === "1-on-1"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                1-on-1
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, session_type: "group" })
                }
                className={`py-2 px-4 rounded-lg font-medium transition ${
                  formData.session_type === "group"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Group
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_at: e.target.value })
              }
              min={minDate}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration
            </label>
            <select
              value={formData.duration_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration_minutes: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Any specific topics or questions you'd like to cover..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
