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

  useEffect(() => {
    // Basic route protection
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchInvoices(token);
    }
  }, [router]);

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
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erro ao fazer upload da nota");
      }

      const data = await res.json();
      setMessage("Upload e processamento concluídos com sucesso!");
      setResult(data.extracted_data);
      
      // Refresh the list after upload
      if (token) fetchInvoices(token);
      
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">NFSe SaaS - Painel</h1>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Sair</button>
      </header>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Área de Upload */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Processar Nova Nota (OCR)</h2>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              <button
                type="submit"
                disabled={!file || loading}
                className={`w-full py-2 px-4 rounded-md font-medium text-white ${
                  !file || loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Processando OCR (Aguarde)..." : "Enviar PDF"}
              </button>
            </form>

            {message && (
              <div className={`mt-4 p-3 rounded-md text-sm ${message.startsWith("Erro") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                {message}
              </div>
            )}

            {result && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">Dados Extraídos pelo Robô:</h3>
                <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-x-auto text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Histórico de Notas */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Histórico de Documentos</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-sm font-semibold text-gray-600">ID</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Número</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">CNPJ Prestador</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Valor (R$)</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Data Upload</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">Nenhuma nota processada ainda.</td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm text-gray-800">#{inv.id}</td>
                        <td className="p-3 text-sm text-gray-800">{inv.invoice_number || "-"}</td>
                        <td className="p-3 text-sm text-gray-800">{inv.issuer_cnpj || "Não encontrado"}</td>
                        <td className="p-3 text-sm text-gray-800">{inv.total_value}</td>
                        <td className="p-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${inv.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-800">
                          {new Date(inv.created_at).toLocaleDateString("pt-BR")}
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
  );
}
