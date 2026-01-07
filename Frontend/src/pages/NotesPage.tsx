import NotesTable from "@/components/modules/NotesTable";

const NotesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Notas y Novedades</h1>
        <p className="text-muted-foreground">Gestionar publicaciones y noticias del sitio</p>
      </div>

      <NotesTable />
    </div>
  );
};

export default NotesPage;
