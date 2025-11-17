import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import Button from "../components/Button";
import authService from "../services/authService";

const API = import.meta.env.VITE_API_URL;

const InvoicingPage = () => {
  const [invoices, setInvoices] = useState([]);

  const load = () => {
    axios.get(`${API}/invoices`, {
      headers: { Authorization: `Bearer ${authService.getToken()}` }
    }).then(res => setInvoices(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Facturación</h1>

      <Button
        className="mb-4"
        onClick={() => {
          const total = prompt("Total:");
          axios.post(
            `${API}/invoices`,
            { total },
            { headers: { Authorization: `Bearer ${authService.getToken()}` } }
          ).then(load);
        }}
      >
        + Crear Factura
      </Button>

      <div className="bg-white shadow rounded-lg p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">ID</th>
              <th className="text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(i => (
              <tr key={i.id} className="border-b">
                <td className="py-2">#{i.id}</td>
                <td>${i.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default InvoicingPage;
