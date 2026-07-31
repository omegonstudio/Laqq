import { attachmentsApi } from "@/lib/api/attachments";
import { useAppDispatch } from "@/store/hooks";
import { useEffect, useState, useRef } from "react";
import {
  Upload,
  FileText,
  Image,
  File,
  Search,
  Loader2,
  Trash2,
  Copy,
} from "lucide-react";
import { Attachment } from "@/types/types";
import Button from "@/components/atoms/Button";
import { toast } from "@/hooks/use-toast";
import { useCanManageAttachments } from "@/hooks/usePermissions";

interface AttachmentListResponse {
  count: number;
  current_page: number;
  next: string | null;
  page_size: number;
  previous: string | null;
  results: Attachment[];
  total_pages: number;
}

const LibreriaPage = () => {
  const dispatch = useAppDispatch();
  const canManageAttachments = useCanManageAttachments();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchAtt = async (
    page: number = 1,
    search?: string,
    append: boolean = false
  ) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res: AttachmentListResponse = await attachmentsApi.list({
        page,
        page_size: 25,
        search: search || undefined,
      });

      if (append) {
        setAttachments((prev) => [...prev, ...res.results]);
      } else {
        setAttachments(res.results);
      }

      setCurrentPage(res.current_page);
      setTotalPages(res.total_pages);
      setTotalCount(res.count);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchAtt();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);

    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce: esperar 500ms antes de buscar
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchAtt(1, value);
    }, 500);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchAtt(currentPage + 1, searchTerm, true);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) =>
        attachmentsApi.create({ file })
      );

      await Promise.all(uploadPromises);

      // Recargar desde la primera página
      setSearchTerm("");
      await fetchAtt(1);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploading(false);
    }
  };
  const handleDelete = async (id: string) => {
    await attachmentsApi.remove(id);
    await fetchAtt(1);
  };
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) {
      return <Image className="w-12 h-12 text-blue-500" />;
    }
    if (contentType === "application/pdf") {
      return <FileText className="w-12 h-12 text-red-500" />;
    }
    return <File className="w-12 h-12 text-gray-500" />;
  };

  const hasMore = currentPage < totalPages;
  const copyToClipboard = async (value?: string | null) => {
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback para entornos sin clipboard API
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.cssText =
          "position:fixed;top:-9999px;left:-9999px;opacity:0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast({ title: "Copiado al portapapeles", description: value });
    } catch (e) {
      console.error("No se pudo copiar al portapapeles", e);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestión de imágenes y archivos de la librería
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} {totalCount === 1 ? "archivo" : "archivos"} en total
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Buscador */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botón de carga */}
          {canManageAttachments && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Cargar archivos
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Cargando archivos...</p>
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-muted-foreground">
            {searchTerm
              ? "No se encontraron archivos con ese término"
              : "No hay archivos en la librería"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {searchTerm
              ? "Intenta con otro término de búsqueda"
              : 'Haz clic en "Cargar archivos" para comenzar'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-card"
              >
                <div className="flex flex-col items-center mb-3">
                  {attachment.content_type_str.startsWith("image/") ? (
                    <img
                      src={attachment.url}
                      alt={attachment.file_name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded mb-2">
                      {getFileIcon(attachment.content_type_str)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3
                    className="font-medium text-sm truncate"
                    title={attachment.file_name}
                  >
                    {attachment.file_name}
                  </h3>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Tamaño: {formatFileSize(attachment.size_bytes)}</p>
                    <p>
                      Fecha:{" "}
                      {new Date(attachment.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2 justify-between">
                    <div className="flex gap-2 ">
                      <Button
                        type="button"
                        onClick={() => copyToClipboard(attachment.file_name)}
                        title={"Copiar nombre"}
                        variant="ghost"
                      >
                        <Copy size={20} />
                      </Button>
                    </div>
                    {canManageAttachments && (
                      <Button
                        variant="secondary"
                        onClick={() => handleDelete(attachment.id)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón Cargar Más */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cargando más...
                  </>
                ) : (
                  <>
                    Cargar más ({attachments.length} de {totalCount})
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LibreriaPage;
