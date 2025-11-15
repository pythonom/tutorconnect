import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { X } from "lucide-react";

type FormState = {
  bio: string;
  skills: string;
};

export const TutorProfileForm = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    bio: "",
    skills: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;

    const res = await fetch(`http://127.0.0.1:8000/api/tutors/${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setFormData({
        bio: data.bio || "",
        skills: data.skills?.join(", ") || "",
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/tutors/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          bio: formData.bio,
          skills: formData.skills
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update profile");
      }

      alert("Profile updated!");
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Update failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold">Edit Profile</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Bio</label>
            <textarea
              className="w-full border p-2 rounded-md"
              rows={4}
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              Skills (comma separated)
            </label>
            <input
              type="text"
              className="w-full border p-2 rounded-md"
              value={formData.skills}
              onChange={(e) =>
                setFormData({ ...formData, skills: e.target.value })
              }
              placeholder="Math, Python, Physics"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};
