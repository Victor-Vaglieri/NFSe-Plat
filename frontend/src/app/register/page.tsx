"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
          name: name,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/login");
      } else {
        const errorMsg = Array.isArray(data.detail) ? data.detail[0].msg : (data.detail || "Erro ao registrar");
        setError(errorMsg);
      }
    } catch (err) {
      setError("Erro na conexão com o servidor");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-[#1a1b1e] flex items-center justify-center transition-colors duration-300 relative overflow-hidden px-4 font-sans">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="bg-white dark:bg-[#25262b] p-8 md:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none w-full max-w-md relative z-10 border border-gray-100 dark:border-white/5">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-5">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Criar <span className="text-blue-600 dark:text-blue-400 font-medium">Conta</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-semibold">Comece a usar agora mesmo</p>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm font-bold text-center border border-red-100 dark:border-red-500/20">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-2">Nome</label>
            <input
              type="text"
              required
              className="w-full px-5 py-3.5 bg-gray-50 dark:bg-[#1a1b1e] border border-gray-200 dark:border-gray-800 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white font-medium transition-all text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu Nome"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-2">E-mail</label>
            <input
              type="email"
              required
              className="w-full px-5 py-3.5 bg-gray-50 dark:bg-[#1a1b1e] border border-gray-200 dark:border-gray-800 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white font-medium transition-all text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-2">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-[#1a1b1e] border border-gray-200 dark:border-gray-800 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white font-medium transition-all pr-14 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold text-sm hover:scale-[1.02] transition-transform shadow-md"
          >
            Finalizar Cadastro
          </button>
        </form>

        <p className="text-center mt-6 text-sm font-semibold text-gray-500 dark:text-gray-400">
          Já tem uma conta?{" "}
          <button onClick={() => router.push("/login")} className="text-blue-600 dark:text-blue-400 hover:underline">
            Faça login
          </button>
        </p>
      </div>
    </div>
  );
}
