export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <main className="text-center p-8 bg-white rounded-lg shadow-sm">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">NFSe SaaS Platform</h1>
        <p className="text-lg text-gray-600 mb-8">A plataforma base já está configurada!</p>
        <div className="flex gap-4 justify-center">
          <a href="/login" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Fazer Login</a>
          <a href="/register" className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-gray-50">Registrar Empresa</a>
        </div>
      </main>
    </div>
  );
}
