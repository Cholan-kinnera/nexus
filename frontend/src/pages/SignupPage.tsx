import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SignupPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post("http://127.0.0.1:8000/api/auth/signup", {
        email,
        password,
      });

      alert("Signup successful!");
      navigate("/login");

    } catch (error) {
      alert("Signup failed");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
      <form
        onSubmit={handleSignup}
        className="bg-[#1A1D29] p-10 rounded-2xl w-[400px]"
      >
        <h1 className="text-4xl font-bold text-white mb-8">
          Create Account
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-4 mb-4 rounded-lg bg-[#2A2D3A] text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 mb-6 rounded-lg bg-[#2A2D3A] text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 p-4 rounded-lg text-white"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}