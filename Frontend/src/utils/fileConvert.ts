// utils/fileConverter.ts

import { apiClient } from "@/api/client";
import { AttachmentCreateRequest, AttachmentResponse } from "@/types/types";

/**
 * Convierte un File a Base64 string (byte stream)
 * @param file - El archivo a convertir
 * @returns Promise con el string Base64
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      // reader.result contiene: "data:image/png;base64,iVBORw0KGgoAAAANS..."
      const result = reader.result as string;

      // Extraer solo la parte Base64 (sin el prefijo "data:image/png;base64,")
      const base64String = result.split(",")[1];

      resolve(base64String);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    // Leer el archivo como Data URL (esto incluye el prefijo con el MIME type)
    reader.readAsDataURL(file);
  });
};

/**
 * Obtiene información del archivo
 */
export const getFileInfo = (file: File) => {
  return {
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  };
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
export const createAttachment = async (
  file: File
): Promise<AttachmentResponse> => {
  try {
    // Convertir archivo a Base64
    const base64Data = await convertFileToBase64(file);
    const fileInfo = getFileInfo(file);

    // Preparar el payload
    const payload: AttachmentCreateRequest = {
      file_name: fileInfo.fileName,
      content_type: fileInfo.contentType,
      size_bytes: fileInfo.sizeBytes,
      data: base64Data, // Byte stream como Base64 string
    };

    // Usar apiClient para hacer la petición
    const response = await apiClient.post<AttachmentResponse>(
      "/attachments/",
      payload
    );

    return response;
  } catch (error) {
    console.error("Error al crear attachment:", error);
    throw error;
  }
};
