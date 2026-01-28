import { Link } from "react-router-dom";
import QuoteForm from "../molecules/QuoteForm";

const QuoteRequest = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Solicitar Cotización</h1>
            <p className="text-xl text-muted-foreground">
              Completa el formulario y nos pondremos en contacto contigo pronto
            </p>
            <p className="text-xl text-muted-foreground">
              Para ver más productos{" "}
              <Link to="/products" className="text-primary underline">
                click aquí
              </Link>
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <QuoteForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuoteRequest;
