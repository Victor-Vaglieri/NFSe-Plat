"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [osList, setOsList] = useState<any[]>([]);
  const [selectedOsId, setSelectedOsId] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [reportMonth, setReportMonth] = useState("2026-09");
  const [reportStatus, setReportStatus] = useState("IDLE");
  const [reportUrl, setReportUrl] = useState("");
  const [hideSensitive, setHideSensitive] = useState(false);

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
    fetchInvoices(token);
    fetchOsList(token);
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
  }

  const fetchOsList = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-orders/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setOsList(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleGenerateReport = async () => {
    const token = localStorage.getItem("token");
    setReportStatus("PENDING");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reference_month: reportMonth })
      });
      const data = await res.json();
      if (data.status === "COMPLETED" && data.file_path) {
        setReportStatus("COMPLETED");
        setReportUrl(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${data.file_path}`);
      }
    } catch (e) {
      setReportStatus("IDLE");
      console.error(e);
    }
  };

  const handleExportSped = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/sped/${reportMonth}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const text = await res.text();
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SPED_EFD_${reportMonth}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkReportStatus = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      const currentReport = data.find((r: any) => r.reference_month === reportMonth);
      if (currentReport && currentReport.status === "COMPLETED" && currentReport.file_path) {
        setReportStatus("COMPLETED");
        setReportUrl(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${currentReport.file_path}`);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    let interval: any;
    if (reportStatus === "PENDING") {
      interval = setInterval(() => {
        checkReportStatus();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [reportStatus, reportMonth]);

  const fetchInvoices = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      } else {
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
    if (files.length === 0) return;

    setLoading(true);
    setMessage("");
    setResult(null);

    const token = localStorage.getItem("token");
    let successCount = 0;
    let errorCount = 0;

    for (const f of files) {
      const formData = new FormData();
      formData.append("file", f);
      if (selectedOsId) {
        formData.append("service_order_id", selectedOsId);
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/upload`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          if (res.status === 401) handleLogout();
          throw new Error();
        }
        successCount++;
      } catch (err: any) {
        errorCount++;
      }
    }

    setMessage(`Upload concluído! ${successCount} notas processadas. ${errorCount > 0 ? `(${errorCount} erros)` : ''}`);
    if (token) fetchInvoices(token);
    setFiles([]);
    setLoading(false);
  };

  const totalInvoices = invoices.length;
  const totalValue = invoices.reduce((acc, curr) => acc + (curr.total_value || 0), 0);
  const successCount = invoices.filter(i => i.status === 'PROCESSADO' || i.status === 'PROCESSED').length;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50/50 via-white to-blue-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-200 flex">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 hidden lg:flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent tracking-tight">VeVOn<span className="font-light text-gray-400 dark:text-gray-500"> NFSe</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <a href="#" className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-4 py-3 rounded-xl font-semibold transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            Dashboard
          </a>
          <a href="/contracts" className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-4 py-3 rounded-xl font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            Contratos
          </a>
          <a href="/service-orders" className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-4 py-3 rounded-xl font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
            Faturamento (OS)
          </a>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative"><div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/5 blur-3xl pointer-events-none" /><div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-blue-500/5 dark:bg-blue-500/5 blur-3xl pointer-events-none" />
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 p-4 sticky top-0 z-10 flex justify-between items-center px-4 sm:px-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Visão Geral</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSensitive} 
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1920px] mx-auto w-full grid grid-cols-1 xl:grid-cols-4 gap-8 text-gray-800 dark:text-gray-100 overflow-y-auto custom-scrollbar">
          
          <div className="xl:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl shadow-indigo-900/5 border border-indigo-50/50 dark:border-gray-700 hover:shadow-md transition-all flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total de Notas</p>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
              </div>
              <h3 className="text-5xl font-extrabold text-gray-800 dark:text-white">{totalInvoices}</h3>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl shadow-indigo-900/5 border border-indigo-50/50 dark:border-gray-700 hover:shadow-md transition-all flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Valor Processado</p>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <h3 className="text-5xl font-extrabold text-green-600 dark:text-green-400 tracking-tight">
                {hideSensitive ? "R$ ****,**" : `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </h3>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl shadow-indigo-900/5 border border-indigo-50/50 dark:border-gray-700 hover:shadow-md transition-all flex flex-col justify-center gap-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Fechamento Mensal</p>
                <input type="month" value={reportMonth} onChange={e => {setReportMonth(e.target.value); setReportStatus("IDLE"); setReportUrl("");}} className="p-1 rounded bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none font-medium text-gray-800 dark:text-white"/>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {reportStatus === "PENDING" ? (
                  <button disabled className="bg-indigo-400 dark:bg-indigo-500/50 text-white py-3 px-2 rounded-xl flex items-center justify-center gap-2 cursor-wait w-full font-bold text-sm">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Preparando PDF...
                  </button>
                ) : reportStatus === "COMPLETED" && reportUrl ? (
                  <a href={reportUrl} target="_blank" className="bg-green-600 hover:bg-green-700 text-white py-3 px-2 rounded-xl flex items-center justify-center gap-2 transition-colors w-full font-bold shadow-sm text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    Baixar PDF Fechado
                  </a>
                ) : (
                  <button onClick={handleGenerateReport} className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-2 rounded-xl flex items-center justify-center gap-2 transition-colors w-full font-bold shadow-sm text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    Relatório (PDF)
                  </button>
                )}
                
                <button onClick={handleExportSped} className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white py-3 px-2 rounded-xl flex items-center justify-center gap-2 transition-colors w-full font-bold shadow-sm text-sm border border-gray-700 dark:border-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  Exportar SPED (.txt)
                </button>
              </div>
            </div>
            
          </div>

          <div className="xl:col-span-1 print:hidden">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl shadow-indigo-900/5 border border-indigo-50/50 dark:border-gray-700 sticky top-8">
              <h2 className="text-2xl font-extrabold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                Nova Nota
              </h2>
              
              <form onSubmit={handleUpload} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Vincular a uma OS (Opcional)</label>
                  <select value={selectedOsId} onChange={e=>setSelectedOsId(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option value="">Sem vínculo (Avulso)</option>
                    {osList.map(os => (
                      <option key={os.id} value={os.id}>OS #{os.id} - {os.description.substring(0, 30)}...</option>
                    ))}
                  </select>
                </div>
                <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative group ${files.length > 0 ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <input
                    type="file"
                    accept=".xml"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-3 relative z-0">
                    <svg className={`w-12 h-12 transition-colors ${files.length > 0 ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    <span className={`text-sm font-semibold truncate max-w-full px-2 ${files.length > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {files.length > 0 
                        ? `${files.length} arquivo(s) selecionado(s)` 
                        : "Clique ou arraste XMLs aqui"}
                    </span>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={files.length === 0 || loading}
                  className={`w-full py-4 px-4 rounded-xl font-bold text-white shadow-sm transition-all text-lg ${
                    files.length === 0 || loading ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
                >
                  {loading ? "Processando..." : "Enviar XMLs"}
                </button>
              </form>

              {message && (
                <div className={`mt-6 p-4 rounded-xl border text-sm font-medium ${message.startsWith("Erro") ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/50" : "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400"}`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-3">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl shadow-indigo-900/5 border border-indigo-50/50 dark:border-gray-700 h-full">
              <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">Histórico de Documentos</h2>
              
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Número</th>
                      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Datas</th>
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
                          <td className="p-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Lançamento: {inv.created_at?.substring(8,10) + "/" + inv.created_at?.substring(5,7) + "/" + inv.created_at?.substring(0,4)}</span>
                              <span className="text-xs">Emissão: {inv.issue_date ? inv.issue_date.substring(8,10) + "/" + inv.issue_date.substring(5,7) + "/" + inv.issue_date.substring(0,4) : "-"}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{hideSensitive ? "***.***/****-**" : (inv.issuer_cnpj || "-")}</td>
                          <td className="p-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-[300px] xl:max-w-none break-words">
                            <div className="max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                              {inv.description || "-"}
                            </div>
                          </td>
                          <td className="p-4 text-sm font-bold text-right whitespace-nowrap">{hideSensitive ? "R$ ****,**" : `R$ ${inv.total_value?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${["PROCESSADO", "PROCESSED", "EMITIDA"].includes(inv.status) ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
                              {inv.status === "PROCESSED" ? "PROCESSADO" : inv.status === "ERROR" ? "ERRO" : inv.status}
                            </span>
                          </td>
                          <td className="p-4 text-center print:hidden">
                            {inv.file_path && (
                              <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${inv.file_path.replace('\\', '/')}`} target="_blank" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium text-sm flex items-center justify-center gap-1">
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
