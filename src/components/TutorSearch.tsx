import { useState, useEffect } from "react";
import { Search, Star, BookOpen } from "lucide-react";

interface Tutor {
  id: number;
  name: string;
  email: string;
  role: string;
  skills?: string[];
  bio?: string;
}

export const TutorSearch = ({
  onSelectTutor,
}: {
  onSelectTutor: (tutor: Tutor) => void;
}) => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [reviewsData, setReviewsData] = useState<Record<number, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTutors();
  }, []);

  const loadTutors = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/tutors");
      if (!res.ok) throw new Error("Failed to fetch tutors");
      const data = await res.json();

      // Add fallback values
      const normalized = data.map((t: any) => ({
        ...t,
        skills: t.skills || ["Mathematics", "Science", "English"],
        bio:
          t.bio ||
          "Experienced and dedicated tutor helping students achieve their goals.",
      }));

      setTutors(normalized);

      // Fetch reviews for each tutor
      for (const tutor of normalized) {
        fetch(`http://127.0.0.1:8000/api/reviews/tutor/${tutor.id}`)
          .then((res) => res.json())
          .then((data) => {
            const avg =
              data.length > 0
                ? Number(
                    (
                      data.reduce((sum: number, r: any) => sum + r.rating, 0) /
                      data.length
                    ).toFixed(1)
                  )
                : null;
            setReviewsData((prev) => ({
              ...prev,
              [tutor.id]: { reviews: data, avgRating: avg },
            }));
          });
      }
    } catch (error) {
      console.error("Error loading tutors:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTutors = tutors.filter((tutor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tutor.name.toLowerCase().includes(searchLower) ||
      tutor.skills?.some((skill) =>
        skill.toLowerCase().includes(searchLower)
      ) ||
      tutor.bio?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-slate-600">Loading tutors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, skill, or subject..."
          className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTutors.map((tutor) => {
          const reviewData = reviewsData[tutor.id];
          const avgRating = reviewData?.avgRating;
          const reviews = reviewData?.reviews || [];

          return (
            <div
              key={tutor.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 border border-slate-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {tutor.name}
                  </h3>

                  {avgRating ? (
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i <= Math.round(avgRating)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                      <span className="text-slate-600 text-sm ml-2">
                        {avgRating} / 5 ({reviews.length} reviews)
                      </span>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm mt-1">
                      No reviews yet
                    </p>
                  )}
                </div>
              </div>

              <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                {tutor.bio || "No bio available"}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {tutor.skills?.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {tutor.skills && tutor.skills.length > 3 && (
                  <span className="text-slate-500 text-xs px-2 py-1">
                    +{tutor.skills.length - 3} more
                  </span>
                )}
              </div>

              {/* Display last 2 reviews — only those with comments */}
              {reviews.filter((r: any) => r.comment && r.comment.trim() !== "")
                .length > 0 && (
                <div className="mb-4 border-t border-slate-200 pt-3 space-y-2">
                  {reviews
                    .filter((r: any) => r.comment && r.comment.trim() !== "")
                    .slice(0, 2)
                    .map((r: any) => (
                      <div
                        key={r.id}
                        className="bg-slate-50 rounded-lg p-2 text-sm"
                      >
                        <p className="font-semibold text-slate-700">
                          {r.learner_name}
                        </p>
                        <p className="text-slate-600 italic">"{r.comment}"</p>
                      </div>
                    ))}
                </div>
              )}

              <button
                onClick={() => onSelectTutor(tutor)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Book Session
              </button>
            </div>
          );
        })}
      </div>

      {filteredTutors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600">No tutors found matching your search</p>
        </div>
      )}
    </div>
  );
};
