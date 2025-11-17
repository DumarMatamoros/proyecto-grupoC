import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import Input from "../components/Input";
import Button from "../components/Button";

const ForgotPasswordPage = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await authService.forgotPassword(data);
      alert("Se ha enviado un correo para recuperar la contraseña.");
      navigate("/login");
    } catch {
      alert("Error al recuperar contraseña");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">

      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Recuperar Contraseña
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input {...register("email")} placeholder="Correo" type="email" />

          <Button className="w-full py-3 text-lg">
            Enviar
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:underline text-sm"
          >
            Volver
          </button>
        </div>
      </div>

    </div>
  );
};

export default ForgotPasswordPage;
