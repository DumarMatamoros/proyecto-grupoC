import { Link } from "react-router-dom";

export default function Error404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg text-center">
        <h1 className="text-6xl font-extrabold text-gray-900">404</h1>
        <p className="mt-4 text-gray-600">La página que buscas no existe.</p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            to="/dashboard"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Ir al Dashboard
          </Link>
          <Link
            to="/login"
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
          >
            Ir al Login
          </Link>
        </div>
      </div>
    </div>
  );
}
