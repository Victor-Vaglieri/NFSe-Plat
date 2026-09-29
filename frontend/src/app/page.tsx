import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-[#1a1b1e] flex flex-col transition-colors duration-300 relative overflow-hidden font-sans">
      
      {/* Decorative Blur Orbs - Tactile Style */}
      <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-[100px] pointer-events-none" />

      {/* Header Minimalista */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
            VeVOn<span className="text-blue-600 dark:text-blue-400 font-medium"> NFSe</span>
          </h1>
        </div>
        <nav className="flex gap-3 items-center bg-white/50 dark:bg-white/5 backdrop-blur-xl px-2 py-2 rounded-full border border-white/20 dark:border-white/10 shadow-sm">
          <Link href="/login" className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 px-5 py-2.5 rounded-full transition-all">
            Entrar
          </Link>
          <Link href="/register" className="text-sm font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 rounded-full hover:scale-105 transition-transform shadow-md">
             Criar Conta
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 max-w-4xl mx-auto mt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-6 border border-blue-100 dark:border-blue-500/20">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          A plataforma base já está configurada!
        </div>
        
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
          Gestão fiscal, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            simples e tátil.
          </span>
        </h2>
        
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl font-medium leading-relaxed">
          Nós redesenhamos a experiência de faturamento. Uma interface que você sente, feita para automatizar suas notas fiscais de serviço sem dor de cabeça.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/register" className="px-8 py-3.5 bg-blue-600 text-white rounded-full font-bold text-base hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all">
            Começar Agora
          </Link>
          <Link href="/login" className="px-8 py-3.5 bg-white dark:bg-[#2a2b30] text-gray-900 dark:text-white rounded-full font-bold text-base border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-800">
            Acessar Painel
          </Link>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="mt-16 w-full max-w-5xl bg-white/40 dark:bg-gray-800/40 p-4 rounded-[2.5rem] backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl">
          <div className="bg-white dark:bg-[#1a1b1e] rounded-[2rem] h-[350px] w-full shadow-inner border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
            {/* Fake Header */}
            <div className="h-12 border-b border-gray-100 dark:border-gray-800 flex items-center px-6 gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            {/* Fake Content */}
            <div className="flex-1 p-6 flex gap-6">
              <div className="w-48 bg-gray-50 dark:bg-[#25262b] rounded-3xl h-full"></div>
              <div className="flex-1 flex flex-col gap-6">
                <div className="flex gap-6 h-24">
                  <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-3xl"></div>
                  <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl"></div>
                </div>
                <div className="flex-1 bg-gray-50 dark:bg-[#25262b] rounded-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
