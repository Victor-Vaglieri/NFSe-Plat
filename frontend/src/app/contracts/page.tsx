"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientCnpj, setClientCnpj] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [darkMode, setDarkMode] = useState(false);
  const [hideSensitive, setHideSensitive] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    if (localStorage.getItem('hideSensitive') === 'true') {
      setHideSensitive(true);
    }
    
    fetchContracts(token);
  }, [router]);

  const toggleSensitive = () => {
    const newVal = !hideSensitive;
    setHideSensitive(newVal);
    localStorage.setItem("hideSensitive", newVal.toString());
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const fetchContracts = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContracts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          client_name: clientName,
          client_cnpj: clientCnpj,
          total_value: totalValue ? parseFloat(totalValue) : null,
          start_date: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        setShowModal(false);
        setClientName("");
        setClientCnpj("");
        setTotalValue("");
        fetchContracts(token!);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleContractStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const token = localStorage.getItem("token");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchContracts(token!);
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-[#121316] transition-colors duration-300 flex font-sans">
      <aside className="w-72 bg-white dark:bg-[#1a1b1e] m-4 rounded-[2rem] hidden lg:flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/5 relative z-20">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
              VeVOn<span className="text-blue-600 dark:text-blue-400 font-medium"> NFSe</span>
            </h1>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-4 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#25262b] hover:text-gray-900 dark:hover:text-white px-5 py-4 rounded-full font-bold transition-all text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            Dashboard
          </Link>
          <Link href="/contracts" className="flex items-center gap-4 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-5 py-4 rounded-full font-bold transition-all text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            Contratos
          </Link>
          <Link href="/service-orders" className="flex items-center gap-4 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#25262b] hover:text-gray-900 dark:hover:text-white px-5 py-4 rounded-full font-bold transition-all text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
            Faturamento (OS)
          </Link>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="flex justify-between items-center px-8 py-6 sticky top-0 z-10">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Gestão de Contratos</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSensitive} 
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-[#1a1b1e] text-gray-600 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-[#25262b] dark:hover:text-white shadow-sm transition-all border border-gray-100 dark:border-white/5"
            >
              {hideSensitive ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
            <button 
              onClick={toggleDarkMode} 
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-[#1a1b1e] text-gray-600 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-[#25262b] dark:hover:text-white shadow-sm transition-all border border-gray-100 dark:border-white/5"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-[#1a1b1e] text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 shadow-sm transition-all font-bold border border-gray-100 dark:border-white/5 text-sm">
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 px-8 pb-8 max-w-[1920px] mx-auto w-full flex flex-col gap-6">
          <div className="flex justify-end">
            <button onClick={() => setShowModal(true)} className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-md transition-transform hover:scale-[1.02] flex items-center gap-2 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Novo Contrato
            </button>
          </div>

          <div className="bg-white dark:bg-[#1a1b1e] rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/5 flex-1 overflow-hidden flex flex-col p-8">
            <div className="overflow-x-auto flex-1 custom-scrollbar border border-gray-100 dark:border-gray-800 rounded-3xl">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-[#25262b]">
                  <tr>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest first:rounded-tl-3xl">ID</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Cliente</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">CNPJ</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Data Início</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Valor Total</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center last:rounded-tr-3xl">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {contracts.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-500 font-medium">Nenhum contrato cadastrado.</td></tr>
                  ) : contracts.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-sm font-bold text-gray-900 dark:text-white">{c.id}</td>
                      <td className="p-4 text-sm font-bold text-gray-900 dark:text-white">{c.client_name}</td>
                      <td className="p-4 text-sm font-mono text-gray-600 dark:text-gray-300">{hideSensitive ? "***.***/****-**" : c.client_cnpj}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{c.start_date.substring(8,10)}/{c.start_date.substring(5,7)}/{c.start_date.substring(0,4)}</td>
                      <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                        {hideSensitive ? "R$ ****,**" : (c.total_value ? `R$ ${c.total_value.toLocaleString('pt-BR', {minimumFractionDigits:2})}` : '-')}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${c.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-[#25262b] dark:text-gray-400"}`}>
                          {c.status === "ACTIVE" ? "ATIVO" : c.status === "INACTIVE" ? "INATIVO" : c.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => toggleContractStatus(c.id, c.status)} className="inline-flex items-center text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-[#25262b] dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-full transition-colors">
                          {c.status === "ACTIVE" ? "Desativar" : "Ativar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a1b1e] rounded-[2.5rem] w-full max-w-md p-8 md:p-10 shadow-2xl border border-gray-100 dark:border-white/10">
              <h3 className="text-xl font-black mb-8 text-gray-900 dark:text-white">Novo Contrato</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2 ml-2 text-gray-700 dark:text-gray-300">Nome do Cliente</label>
                  <input type="text" required value={clientName} onChange={e=>setClientName(e.target.value)} className="w-full px-5 py-3.5 rounded-full border border-gray-200 dark:border-gray-800 text-gray-900 bg-gray-50 dark:bg-[#25262b] dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 ml-2 text-gray-700 dark:text-gray-300">CNPJ</label>
                  <input type="text" required value={clientCnpj} onChange={e=>setClientCnpj(e.target.value)} className="w-full px-5 py-3.5 rounded-full border border-gray-200 dark:border-gray-800 text-gray-900 bg-gray-50 dark:bg-[#25262b] dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 ml-2 text-gray-700 dark:text-gray-300">Valor Total (Opcional)</label>
                  <input type="number" step="0.01" value={totalValue} onChange={e=>setTotalValue(e.target.value)} className="w-full px-5 py-3.5 rounded-full border border-gray-200 dark:border-gray-800 text-gray-900 bg-gray-50 dark:bg-[#25262b] dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium transition-all text-sm" />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#25262b] font-bold transition-colors text-sm">Cancelar</button>
                  <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 hover:scale-[1.02] shadow-md transition-transform text-sm">
                    {loading ? 'Salvando...' : 'Salvar Contrato'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
