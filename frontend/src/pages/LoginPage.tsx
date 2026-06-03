import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

const handleSubmit = async (
  e: React.FormEvent
) => {
  e.preventDefault();
  setLoading(true);

  try {
    const data = await loginUser(
      email,
      password
    );

    login(data.access_token, { full_name: data.full_name, email: data.email || email });

    navigate("/dashboard");
  } catch (error) {
    console.error(error);
    alert("Invalid credentials");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1A1D27] p-8 rounded-xl w-full max-w-md space-y-4"
      >
        <h1 className="text-3xl font-bold text-white">
          Nexus PM
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full p-3 rounded bg-[#252836] text-white"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full p-3 rounded bg-[#252836] text-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 p-3 rounded text-white"
        >
          {loading
            ? "Signing in..."
            : "Sign In"}
        </button>
      </form>
    </div>
  );
}
