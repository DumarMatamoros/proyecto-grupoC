import React from "react";
import ReactDOM from "react-dom/client";

// 🚀 Importa tu router principal (AppRouter)
import AppRouter from "./App.jsx";

// 🎨 Importa todos los CSS desde tu carpeta /css
import "./css/index.css";
import "./css/App.css";
import "./css/login.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
