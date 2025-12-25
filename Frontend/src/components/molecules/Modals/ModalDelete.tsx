import Button from "@/components/atoms/Button";
import Modal from "@/components/common/Modal";

interface ModalDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string; // Solo para mostrar
  onConfirm: () => void; // Callback sin parámetros
}

const ModalDelete: React.FC<ModalDeleteProps> = ({
  isOpen,
  onClose,
  itemName,
  onConfirm,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar" size="sm">
      <div className="space-y-4">
        <p className="text-xl text-gray-600 dark:text-gray-400">
          ¿Estás seguro de que deseas eliminar "{itemName}"?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalDelete;
