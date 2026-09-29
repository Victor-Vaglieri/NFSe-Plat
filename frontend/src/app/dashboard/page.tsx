"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [osList, setOsList] = useState<any[]>([]);
  const [selectedOsId, setSelectedOsId] = useState<string>("");
  
  const [reportMonth, setReportMonth] = useState("");
  const [reportStatus, setReportStatus] = useState("IDLE");
  const [reportUrl, setReportUrl] = useState("");
  
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

    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setReportMonth(`${now.getFullYear()}-${m}`);

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
  };

  const fetchInvoices = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOsList = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-orders/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOsList(data.filter((os: any) => os.status === 'OPEN' || os.status === 'IN_PROGRESS'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateReport = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setReportStatus("LOADING");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reference_month: reportMonth })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "COMPLETED" && data.file_path) {
          setReportStatus("COMPLETED");
          setReportUrl(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${data.file_path.replace('\\', '/')}`);
        } else {
          setReportStatus("PENDING");
        }
      } else {
        setReportStatus("ERROR");
      }
    } catch(e) {
      setReportStatus("ERROR");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    if (files.length === 0) {
      setMessage("Selecione pelo menos um arquivo XML.");
      return;
    }

    setLoading(true);
    setMessage("");

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      if (selectedOsId) {
        formData.append("service_order_id", selectedOsId);
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/upload/`, {
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

  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-[#121316] transition-colors duration-300 flex font-sans">
      
      {/* Floating Island Sidebar */}
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
          <Link href="/dashboard" className="flex items-center gap-4 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-5 py-4 rounded-full font-bold transition-all text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            Dashboard
          </Link>
          <Link href="/contracts" className="flex items-center gap-4 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#25262b] hover:text-gray-900 dark:hover:text-white px-5 py-4 rounded-full font-bold transition-all text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            Contratos
          </Link>
          <Link href="/service-orders" className="flex items-center gap-4 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#25262b] hover:text-gray-900 dark:hover:text-white px-5 py-4 rounded-full font-bold transition-all text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
            Faturamento (OS)
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="flex justify-between items-center px-8 py-6 sticky top-0 z-10">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Visão Geral</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSensitive} 
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-[#1a1b1e] text-gray-600 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-[#25262b] dark:hover:text-white shadow-sm transition-all border border-gray-100 dark:border-white/5"
              title={hideSensitive ? "Mostrar Valores" : "Ocultar Valores"}
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
              title="Alternar Tema"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-[#1a1b1e] text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 shadow-sm transition-all font-bold border border-gray-100 dark:border-white/5 text-sm">
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 px-8 pb-8 max-w-[1920px] mx-auto w-full flex flex-col gap-6 text-gray-800 dark:text-gray-100 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Big KPI Cards */}
            <div className="xl:col-span-2 bg-white dark:bg-[#1a1b1e] p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/5 flex flex-col justify-center relative overflow-hidden min-h-[160px]">
              <div className="absolute top-0 right-0 p-8">
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Total de Notas</p>
              <h3 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{totalInvoices}</h3>
            </div>
            
            <div className="xl:col-span-2 bg-white dark:bg-[#1a1b1e] p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/5 flex flex-col justify-center relative overflow-hidden min-h-[160px]">
              <div className="absolute top-0 right-0 p-8">
                <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Valor Processado</p>
              <h3 className="text-4xl md:text-5xl font-black text-green-600 dark:text-green-400 tracking-tight">
                {hideSensitive ? "R$ ****,**" : `R$ ${totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
              </h3>
            </div>

            <div className="xl:col-span-4 bg-white dark:bg-[#1a1b1e] p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Fechamento Mensal</p>
                <div className="flex items-center gap-4">
                  <input type="month" value={reportMonth} onChange={e => {setReportMonth(e.target.value); setReportStatus("IDLE"); setReportUrl("");}} className="px-4 py-2 rounded-full bg-gray-50 dark:bg-[#25262b] border border-gray-200 dark:border-gray-800 text-sm font-bold outline-none text-gray-900 dark:text-white"/>
                </div>
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                {reportStatus === "COMPLETED" && reportUrl ? (
                  <a href={reportUrl} target="_blank" className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-md transition-all text-center flex justify-center items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Relatório (PDF)
                  </a>
                ) : (
                  <button onClick={handleGenerateReport} disabled={reportStatus === "LOADING" || reportStatus === "PENDING"} className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 rounded-full font-bold transition-all disabled:opacity-50 text-sm">
                    {reportStatus === "LOADING" ? "Gerando..." : reportStatus === "PENDING" ? "Na Fila..." : "Gerar Relatório"}
                  </button>
                )}
                <a href={`${process.env.NEXT_PUBLIC_API_URL}/reports/sped/${reportMonth}`} target="_blank" className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-105 rounded-full font-bold shadow-md transition-all text-center flex justify-center items-center gap-2 text-sm">
                  Exportar SPED
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-[500px]">
            <div className="xl:col-span-1 flex flex-col h-full">
              <div className="bg-white dark:bg-[#1a1b1e] p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nova Nota</h3>
                </div>
                
                <form onSubmit={handleUpload} className="flex flex-col gap-6 flex-1">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-2">Vincular OS</label>
                    <select value={selectedOsId} onChange={e=>setSelectedOsId(e.target.value)} className="w-full px-5 py-3.5 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#25262b] text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-sm">
                      <option value="">Sem vínculo (Avulso)</option>
                      {osList.map(os => (
                        <option key={os.id} value={os.id}>OS #{os.id} - {os.client_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={`flex-1 border-2 border-dashed rounded-[2rem] p-8 text-center transition-all cursor-pointer relative group flex flex-col justify-center min-h-[200px] ${files.length > 0 ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-[#25262b]'}`}>
                    <input type="file" accept=".xml" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${files.length > 0 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-[#25262b] text-gray-400 dark:text-gray-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-500'}`}>
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </div>
                      <span className={`text-sm font-bold px-4 ${files.length > 0 ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        {files.length > 0 ? `${files.length} arquivo(s) pronto(s)` : "Arraste os XMLs aqui"}
                      </span>
                    </div>
                  </div>
                  
                  <button type="submit" disabled={files.length === 0 || loading} className={`w-full py-3.5 rounded-full font-bold text-sm transition-all ${files.length === 0 || loading ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] shadow-md"}`}>
                    {loading ? "Processando..." : "Enviar XMLs"}
                  </button>
                </form>
              </div>
            </div>

            <div className="xl:col-span-3">
              <div className="bg-white dark:bg-[#1a1b1e] p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/5 h-full flex flex-col">
                <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Histórico de Notas</h2>
                <div className="flex-1 overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-3xl">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50 dark:bg-[#25262b]">
                      <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest first:rounded-tl-3xl">Número</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Datas</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">CNPJ</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Descrição</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Valor</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Status</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center last:rounded-tr-3xl">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {invoices.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-500 font-medium">Nenhuma nota processada.</td></tr>
                      ) : invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 text-sm font-bold text-gray-900 dark:text-white">{inv.invoice_number || "-"}</td>
                          <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-gray-700 dark:text-gray-300">Lançamento: {inv.created_at?.substring(8,10)}/{inv.created_at?.substring(5,7)}</span>
                              <span className="text-xs">Emissão: {inv.issue_date ? `${inv.issue_date.substring(8,10)}/${inv.issue_date.substring(5,7)}` : "-"}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-mono text-gray-600 dark:text-gray-300">{hideSensitive ? "***.***/****-**" : (inv.issuer_cnpj || "-")}</td>
                          <td className="p-4 text-sm text-gray-600 dark:text-gray-300 max-w-[250px] truncate">{inv.description || "-"}</td>
                          <td className="p-4 text-sm font-bold text-right text-gray-900 dark:text-white">{hideSensitive ? "R$ ****,**" : `R$ ${inv.total_value?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${["PROCESSADO", "PROCESSED", "EMITIDA"].includes(inv.status) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {inv.status === "PROCESSED" ? "PROCESSADO" : inv.status === "ERROR" ? "ERRO" : inv.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {inv.file_path && (
                              <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${inv.file_path.replace('\\', '/')}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-full transition-colors">
                                Abrir
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
