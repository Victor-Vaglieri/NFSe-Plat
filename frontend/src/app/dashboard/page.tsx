"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchInvoices(token);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  }

  const fetchInvoices = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/invoices/", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      } else {
        // If unauthorized or DB reset, log out
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          handleLogout();
        }
      }
    } catch (e) {
      console.error("Failed to fetch invoices", e);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/v1/invoices/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 401) handleLogout();
        throw new Error(errorData.detail || "Erro ao fazer upload da nota");
      }

      const data = await res.json();
      setMessage("Upload e processamento concluídos com sucesso!");
      setResult(data.extracted_data);
      
      if (token) fetchInvoices(token);
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Summary Math
  const totalInvoices = invoices.length;
  const totalValue = invoices.reduce((acc, curr) => acc + (curr.total_value || 0), 0);
  const successCount = invoices.filter(i => i.status === 'PROCESSADO').length;

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center print:hidden border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">NFSe<span className="text-blue-600 dark:text-blue-400">SaaS</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="text-sm p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors dark:text-white"
              title="Alternar Tema"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1920px] mx-auto w-full grid grid-cols-1 xl:grid-cols-4 gap-6 text-gray-800 dark:text-gray-100">
          
          {/* Resumo e Relatório */}
          <div className="xl:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total de Notas</p>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
              </div>
              <h3 className="text-4xl font-bold mt-4">{totalInvoices}</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Processado</p>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <h3 className="text-4xl font-bold text-green-600 dark:text-green-400 mt-4">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-6 flex flex-col justify-center items-center print:hidden h-full">
               <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 px-6 rounded-xl w-full h-full flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                 </svg>
                 Gerar Relatório (PDF)
               </button>
            </div>
          </div>

          {/* Lado Esquerdo: Área de Upload */}
          <div className="xl:col-span-1 print:hidden">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-6">
              <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">Nova Nota (OCR)</h2>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span className="text-sm text-gray-500 dark:text-gray-300 font-medium truncate max-w-full">
                      {file ? file.name : "Clique ou arraste um PDF aqui"}
                    </span>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={!file || loading}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-sm transition-all ${
                    !file || loading ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"
                  }`}
                >
                  {loading ? "Robô Analisando..." : "Processar Documento"}
                </button>
              </form>

              {message && (
                <div className={`mt-6 p-4 rounded-xl border text-sm font-medium ${message.startsWith("Erro") ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/50" : "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400"}`}>
                  {message}
                </div>
              )}

              {result && (
                <div className="mt-8 border-t dark:border-gray-700 pt-6">
                  <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-gray-500 dark:text-gray-400">Dados Extraídos</h3>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-xs font-mono shadow-inner max-h-60">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Histórico de Notas */}
          <div className="xl:col-span-3">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
              <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">Histórico de Documentos</h2>
              
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Número</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Emissão</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">CNPJ</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-2/5">Descrição</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Valor</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Status</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center print:hidden">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">Nenhuma nota processada.</td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="border-b dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="p-4 text-sm font-medium">{inv.invoice_number || "-"}</td>
                          <td className="p-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString("pt-BR") : "-"}</td>
                          <td className="p-4 text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{inv.issuer_cnpj || "-"}</td>
                          <td className="p-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-[300px] xl:max-w-none break-words">
                            <div className="max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                              {inv.description || "-"}
                            </div>
                          </td>
                          <td className="p-4 text-sm font-bold text-right whitespace-nowrap">R$ {inv.total_value?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${inv.status === 'PROCESSADO' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-4 text-center print:hidden">
                            {inv.file_path && (
                              <a href={`http://localhost:8000/${inv.file_path.replace('\\', '/')}`} target="_blank" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium text-sm flex items-center justify-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                Abrir
                              </a>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
