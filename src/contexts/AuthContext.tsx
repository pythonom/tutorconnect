import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  email: string;
  name: string;
  role: "tutor" | "learner";
}

interface AuthContextType {
  user: User | null;
  // profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: "tutor" | "learner"
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // On app load → read stored user from localStorage

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      // setUser(JSON.parse(storedUser));
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);

      if (parsedUser.role === "tutor") {
        navigate("/tutor-dashboard", { replace: true });
      } else {
        navigate("/learner-dashboard", { replace: true });
      }
    }
    setLoading(false);
  }, [navigate]);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: "tutor" | "learner"
  ) => {
    const res = await fetch("http://127.0.0.1:8000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: fullName, role }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Signup failed");
    }

    // Auto login after sign up
    await signIn(email, password);
  };

  const signIn = async (email: string, password: string) => {
    const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Invalid credentials");
    }

    const data = await res.json();

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);

    if (data.user.role === "tutor") {
      navigate("/tutor-dashboard");
    } else {
      navigate("/learner-dashboard");
    }
  };

  const signOut = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/auth", { replace: true });
  };

  const value = {
    user,
    // profile,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
