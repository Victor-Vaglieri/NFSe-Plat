"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [clientName, setClientName] = useState("");
  const [clientCnpj, setClientCnpj] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchContracts(token);
  }, []);

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
      if (res.ok) setContracts(await res.json());
      else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleContractStatus = async (contractId: number, currentStatus: string) => {
    const token = localStorage.getItem("token");
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts/${contractId}/status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchContracts(token!);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts/`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_name: clientName,
          client_cnpj: clientCnpj,
          total_value: totalValue ? parseFloat(totalValue) : null
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center print:hidden border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">NFSe<span className="text-blue-600 dark:text-blue-400">SaaS</span></h1>
            </div>
            <nav className="hidden md:flex gap-6">
              <a href="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Notas Fiscais</a>
              <a href="/contracts" className="text-sm font-semibold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1">Contratos</a>
              <a href="/service-orders" className="text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Ordens de Serviço</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className="text-sm p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors dark:text-white">
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors font-medium">
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1920px] mx-auto w-full text-gray-800 dark:text-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">Gerenciamento de Contratos</h2>
            <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all">
              + Novo Contrato
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 dark:border-gray-700">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">ID</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Cliente</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">CNPJ</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Data Início</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Valor Total</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum contrato cadastrado.</td></tr>
                  ) : contracts.map(c => (
                    <tr key={c.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-4 font-mono text-sm">{c.id}</td>
                      <td className="p-4 font-semibold">{c.client_name}</td>
                      <td className="p-4 font-mono text-sm">{c.client_cnpj}</td>
                      <td className="p-4 text-sm">{c.start_date.substring(8,10) + "/" + c.start_date.substring(5,7) + "/" + c.start_date.substring(0,4)}</td>
                      <td className="p-4 text-right font-bold">
                        {c.total_value ? `R$ ${c.total_value.toLocaleString('pt-BR', {minimumFractionDigits:2})}` : '-'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.status === "ACTIVE" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}`}>{c.status === "ACTIVE" ? "ATIVO" : c.status === "INACTIVE" ? "INATIVO" : c.status}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => toggleContractStatus(c.id, c.status)} className="text-sm px-3 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 font-medium transition-colors">
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Novo Contrato</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Nome do Cliente</label>
                  <input type="text" required value={clientName} onChange={e=>setClientName(e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">CNPJ</label>
                  <input type="text" required value={clientCnpj} onChange={e=>setClientCnpj(e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Valor Total (Opcional)</label>
                  <input type="number" step="0.01" value={totalValue} onChange={e=>setTotalValue(e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 font-semibold">Cancelar</button>
                  <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50">
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
