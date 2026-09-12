import { useState } from "react";

import InputField from "../atoms/InputField";
import Select from "../atoms/Select";
import Button from "../atoms/Button";
import {
  certificatesApi,
  type CertificateProvider,
  type CertificateResult,
} from "@/lib/api/certificates";
import { extractErrorMessage } from "@/lib/api/client";

const CertificatesModal = () => {
  const [brand, setBrand] = useState<CertificateProvider>("fisher");
  const [articleNo, setArticleNo] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<CertificateResult[]>([]);

  const handleBrandChange = (value: string) => {
    const next = value as CertificateProvider;
    setBrand(next);
    setError(null);
    setMessage(null);
    setResults([]);
    if (next === "solstice") {
      setArticleNo("");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setResults([]);

    if (brand === "fisher" && articleNo.trim().length < 2) {
      setError("Ingresá un Número de Artículo (mínimo 2 caracteres).");
      return;
    }
    if (brand === "solstice" && !lotNo.trim()) {
      setError("Ingresá un Número de Lote.");
      return;
    }

    setLoading(true);
    try {
      const data = await certificatesApi.search({
        provider: brand,
        articleNo: brand === "fisher" ? articleNo.trim() : undefined,
        lotNo: lotNo.trim() || undefined,
      });
      setResults(data.results ?? []);
      setMessage(data.message || null);
      if (!(data.results && data.results.length)) {
        setError(null);
      }
    } catch (err) {
      setResults([]);
      setMessage(null);
      setError(extractErrorMessage(err, "No se pudo completar la búsqueda."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Búsqueda de Certificados
            </h1>

            <p className="text-xl text-muted-foreground">
              Consulta certificados de análisis para productos Fisher y
              Solstice
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <form onSubmit={handleSearch} className="space-y-6">
              <Select
                label="Marca"
                value={brand}
                onChange={(e) => handleBrandChange(e.target.value)}
                options={[
                  { value: "fisher", label: "Fisher Scientific" },
                  { value: "solstice", label: "Solstice" },
                ]}
              />

              {brand === "fisher" && (
                <InputField
                  label="Número de Artículo"
                  value={articleNo}
                  onChange={(e) => setArticleNo(e.target.value)}
                  placeholder="Ej: 123456"
                  required
                  disabled={loading}
                />
              )}

              <InputField
                label="Número de Lote"
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                placeholder={
                  brand === "solstice" ? "Ej: BR22150009" : "Ej: LOT123456"
                }
                required={brand === "solstice"}
                disabled={loading}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Buscando…" : "Buscar Certificado"}
              </Button>
            </form>

            {error && (
              <div
                className="mt-6 p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            {!error && message && results.length === 0 && (
              <div className="mt-6 p-4 rounded-xl bg-muted/30 text-sm text-muted-foreground">
                {message}
              </div>
            )}

            {results.length > 0 && (
              <div className="mt-6 space-y-3">
                {message && (
                  <p className="text-sm text-muted-foreground">{message}</p>
                )}
                <ul className="space-y-3">
                  {results.map((item) => (
                    <li
                      key={item.id || item.url || `${item.title}-${item.lotNumber}`}
                      className="p-4 rounded-xl border border-border bg-muted/20"
                    >
                      <div className="font-medium text-foreground">
                        {item.title || item.fileName || "Certificado"}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
                        {item.documentType && <div>{item.documentType}</div>}
                        {item.lotNumber && <div>Lote: {item.lotNumber}</div>}
                        {item.productTitles?.[0] && (
                          <div>{item.productTitles[0]}</div>
                        )}
                      </div>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
                        >
                          Abrir / descargar PDF
                        </a>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">
                          Sin enlace de descarga disponible.
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 p-4 bg-muted/30 rounded-xl">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Nota:</strong>{" "}
                {brand === "fisher"
                  ? "El número de artículo es obligatorio; el lote es opcional. Ambos figuran en la etiqueta del producto."
                  : "Para Solstice solo se necesita el número de lote/batch que figura en la etiqueta del producto."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CertificatesModal;
