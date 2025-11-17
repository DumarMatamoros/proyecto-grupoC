import "../css/login.css";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Registro() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("administrador");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        nombre: nombre,
        email: email,
        tipo: tipo.toLowerCase(), // Laravel exige estos valores en minúsculas
        password: password,
        password_confirmation: password2, // CAMPO CORRECTO PARA LARAVEL
      });

      console.log("REGISTRO OK:", res.data);

      navigate("/login");
    } catch (err) {
      console.log("ERROR BACKEND:", err.response?.data);
      setError(err.response?.data?.message || "Error al registrar usuario");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">

        <div className="login-form">
          <h1 className="title">Crear Usuario</h1>
          {error && <p className="error">{error}</p>}

          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            >
              <option value="administrador">Administrador</option>
              <option value="empleado">Empleado</option>
              <option value="cliente">Cliente</option>
              <option value="proveedor">Proveedor</option>
            </select>

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />

            <button className="btn-secondary">Registrar</button>
          </form>

          <button
            className="btn-link"
            onClick={() => navigate("/login")}
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>

        <div className="login-image">
          <img src="/src/assets/login-rocket.svg" alt="" />
        </div>
      </div>
    </div>
  );
}
