"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ServiceOrdersPage() {
  const router = useRouter();
  const [osList, setOsList] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [hideSensitive, setHideSensitive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [contractId, setContractId] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');

    const isHidden = localStorage.getItem("hideSensitive") === "true";
    setHideSensitive(isHidden);
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData(token);
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

  const fetchData = async (token: string) => {
    try {
      const [osRes, contRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-orders/`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts/`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      
      if (osRes.ok) setOsList(await osRes.json());
      if (contRes.ok) setContracts(await contRes.json());
      else if (osRes.status === 401) handleLogout();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFaturar = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/issue/${id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        alert("NFSe emitida com sucesso!");
        fetchData(token!);
      } else {
        const error = await res.json();
        alert(error.detail || "Erro ao faturar a OS.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro de comunicação com o servidor.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("contract_id", contractId);
      formData.append("description", description);
      formData.append("value", value);
      if (file) formData.append("file", file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-orders/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        setShowModal(false);
        setContractId("");
        setDescription("");
        setValue("");
        setFile(null);
        fetchData(token!);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50/50 via-white to-blue-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-200 flex">
      {/* Sidebar idêntica à do Dashboard */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 hidden lg:flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent tracking-tight">VeVOn<span className="font-light text-gray-400 dark:text-gray-500"> NFSe</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <a href="/dashboard" className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-4 py-3 rounded-xl font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            Dashboard
          </a>
          <a href="/contracts" className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-4 py-3 rounded-xl font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            Contratos
          </a>
          <a href="#" className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-4 py-3 rounded-xl font-semibold transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
            Faturamento (OS)
          </a>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative"><div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/5 blur-3xl pointer-events-none" /><div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-blue-500/5 dark:bg-blue-500/5 blur-3xl pointer-events-none" />
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 p-4 sticky top-0 z-10 flex justify-between items-center px-4 sm:px-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Faturamento</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const newMode = !hideSensitive;
                setHideSensitive(newMode);
                localStorage.setItem("hideSensitive", newMode ? "true" : "false");
              }} 
              className="text-gray-500 dark:text-gray-400 text-sm p-2 rounded-full hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white transition-all"
              title={hideSensitive ? "Mostrar Valores" : "Ocultar Valores"}
            >
              {hideSensitive ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
            <button 
              onClick={toggleDarkMode} 
              className="text-gray-500 dark:text-gray-400 text-sm p-2 rounded-full hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white transition-all"
              title="Alternar Tema"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors font-medium">
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1920px] mx-auto w-full text-gray-800 dark:text-gray-100 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Ordens de Serviço</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Lançamento e faturamento de OS</p>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-semibold shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Emitir OS
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-indigo-900/5 border border-indigo-50/50 dark:border-gray-700 flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">OS #</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Contrato ID</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Descrição</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Data</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Valor</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Anexo</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {osList.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">Nenhuma OS encontrada.</td></tr>
                  ) : osList.map(os => (
                    <tr key={os.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-4 font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{os.id}</td>
                      <td className="p-4 font-mono text-sm">{os.contract_id}</td>
                      <td className="p-4 text-sm max-w-[200px] truncate">{os.description}</td>
                      <td className="p-4 text-sm">{os.execution_date.substring(8,10) + "/" + os.execution_date.substring(5,7) + "/" + os.execution_date.substring(0,4)}</td>
                      <td className="p-4 text-right font-bold">
                        {hideSensitive ? "R$ ****,**" : `R$ ${os.value.toLocaleString('pt-BR', {minimumFractionDigits:2})}`}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${os.status === "BILLED" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"}`}>
                          {os.status === "BILLED" ? "FATURADO" : os.status === "PENDING" ? "PENDENTE" : os.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {os.file_path && (
                          <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${os.file_path.replace('\\', '/')}`} target="_blank" className="text-blue-500 hover:underline text-sm font-bold">
                            Ver
                          </a>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {os.status !== 'BILLED' && (
                          <button 
                            onClick={() => handleFaturar(os.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-3 rounded shadow transition-all"
                          >
                            Faturar
                          </button>
                        )}
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Emitir Nova OS</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Contrato Vinculado</label>
                  <select required value={contractId} onChange={e=>setContractId(e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Selecione um contrato...</option>
                    {contracts.map(c => (
                      <option key={c.id} value={c.id}>{c.client_name} (CNPJ: {c.client_cnpj})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Descrição do Serviço</label>
                  <textarea required value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Valor da OS</label>
                  <input type="number" step="0.01" required value={value} onChange={e=>setValue(e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Comprovante (Imagem/PDF)</label>
                  <input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} className="w-full text-sm dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 font-semibold">Cancelar</button>
                  <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'Processando...' : 'Emitir OS'}
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
