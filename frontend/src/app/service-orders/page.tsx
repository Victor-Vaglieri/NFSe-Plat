"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ServiceOrdersPage() {
  const router = useRouter();
  const [osList, setOsList] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
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
              <a href="/contracts" className="text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Contratos</a>
              <a href="/service-orders" className="text-sm font-semibold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1">Ordens de Serviço</a>
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
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">Ordens de Serviço</h2>
            <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all">
              + Emitir OS
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 dark:border-gray-700">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">OS #</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Contrato ID</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Descrição</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Data</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Valor</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase text-center">Status</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase text-center">Anexo</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {osList.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-neutral-500">Nenhuma OS encontrada.</td></tr>
                  ) : osList.map(os => (
                    <tr key={os.id} className="border-b dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td className="p-4 font-mono text-sm font-bold text-blue-600">{os.id}</td>
                      <td className="p-4 font-mono text-sm">{os.contract_id}</td>
                      <td className="p-4 text-sm max-w-[200px] truncate">{os.description}</td>
                      <td className="p-4 text-sm">{os.execution_date.substring(8,10) + "/" + os.execution_date.substring(5,7) + "/" + os.execution_date.substring(0,4)}</td>
                      <td className="p-4 text-right font-bold">R$ {os.value.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${os.status === "BILLED" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"}`}>{os.status === "BILLED" ? "FATURADO" : os.status === "PENDING" ? "PENDENTE" : os.status}</span>
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
