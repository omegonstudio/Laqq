import ContactsABM from "@/components/modules/ContactsABM";

const ContactsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Contactos</h1>
        <p className="text-muted-foreground mt-1">
          Administración de consultas y contactos de clientes
        </p>
      </div>
      <ContactsABM />
    </div>
  );
};

export default ContactsPage;
