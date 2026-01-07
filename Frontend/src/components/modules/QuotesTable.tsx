import { useState } from "react";
import { Eye, FileText, Trash2 } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import { mockQuotes, BackofficeQuote } from "@/utils/mockData/quotes";

const QuotesTable = () => {
  const [quotes] = useState<BackofficeQuote[]>(mockQuotes);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.numero.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || quote.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleView = (quote: BackofficeQuote) => {
    console.log("Ver cotización:", quote);
  };

  const handlePDF = (quote: BackofficeQuote) => {
    console.log("Generar PDF:", quote);
  };

  const handleDelete = (quote: BackofficeQuote) => {
    console.log("Eliminar cotización:", quote);
  };

  const columns = [
    { key: "numero", label: "N° Cotización", sortable: true },
    { key: "empresa", label: "Empresa", sortable: true },
    { key: "pais", label: "País", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "usuario", label: "Usuario", sortable: true },
    { key: "fecha", label: "Fecha", sortable: true },
    { key: "tipo", label: "Tipo", sortable: true },
    { key: "estado", label: "Estado", sortable: true },
  ];

  const actions = [
    { icon: <Eye size={16} />, onClick: handleView, label: "Ver detalles" },
    { icon: <FileText size={16} />, onClick: handlePDF, label: "Generar PDF" },
    { icon: <Trash2 size={16} />, onClick: handleDelete, color: "red", label: "Eliminar" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <InputField
          placeholder="Buscar por empresa o número..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "all", label: "Todos los estados" },
            { value: "Pendiente", label: "Pendiente" },
            { value: "Enviada", label: "Enviada" },
            { value: "Confirmada", label: "Confirmada" }
          ]}
          className="max-w-xs"
        />
      </div>

      <Table columns={columns} data={filteredQuotes} actions={actions} />
    </div>
  );
};

export default QuotesTable;
