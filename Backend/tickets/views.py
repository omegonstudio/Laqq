from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.contenttypes.models import ContentType
from .models import ServiceTicket, TicketState, TicketPriority
from .serializers import ServiceTicketSerializer, TicketStateSerializer, TicketPrioritySerializer
from .permissions import IsAdminOrBackOffice, IsClientOwnerOrStaff, CanAttachFiles, CanCreateTicketOrStaff
from attachments.models import Attachment
from .emails import send_ticket_created_email
import secrets
import string

class TicketStateViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar estados de tickets"""
    queryset = TicketState.objects.all()
    serializer_class = TicketStateSerializer
    permission_classes = [IsAuthenticated, IsAdminOrBackOffice]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name', 'is_final']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class TicketPriorityViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar prioridades de tickets"""
    queryset = TicketPriority.objects.all()
    serializer_class = TicketPrioritySerializer
    permission_classes = [IsAuthenticated, IsAdminOrBackOffice]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name', 'level']
    search_fields = ['name', 'description']
    ordering_fields = ['level', 'name', 'created_at']
    ordering = ['-level']

class ServiceTicketViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar tickets de servicio técnico"""
    queryset = ServiceTicket.objects.select_related(
        'contact', 'product', 'state', 'priority', 'assigned_user'
    ).all()
    serializer_class = ServiceTicketSerializer
    permission_classes = [CanCreateTicketOrStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'contact',
        'product',
        'state',
        'priority',
        'assigned_user'
    ]
    search_fields = [
        'ticket_number',
        'product_name',
        'description',
        'resolution_notes'
    ]
    ordering_fields = [
        'ticket_number',
        'created_at',
        'updated_at',
        'assigned_at',
        'started_at',
        'resolved_at',
        'closed_at',
        'priority__level'
    ]
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filtrar tickets según el tipo de usuario:
        - Usuarios no autenticados: queryset vacío (solo pueden hacer POST)
        - Clientes: solo ven sus propios tickets (basado en email)
        - Admin/BackOffice: ven todos los tickets
        """
        user = self.request.user
        queryset = super().get_queryset()

        # Si no está autenticado, devolver queryset vacío
        if not user.is_authenticated:
            return queryset.none()

        # Si es cliente, filtrar solo sus tickets
        if user.user_type_id in ['client', 'CLIENT']:
            # Filtrar solo tickets del cliente (matching por email)
            queryset = queryset.filter(contact__email=user.email)

        return queryset

    def perform_create(self, serializer):
        """
        Crear ticket y enviar notificaciones por email
        """
        # Guardar el ticket
        ticket = serializer.save()
        
        # Generar credenciales para el cliente
        contact = ticket.contact
        
        # Generar username y password
        username = contact.email
        # Generar password aleatorio de 12 caracteres
        password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        
        # Enviar emails
        try:
            results = send_ticket_created_email(ticket, username, password)
            
            if results['business']:
                print(f"✅ Email enviado al negocio para ticket #{ticket.ticket_number}")
            else:
                print(f"⚠️ No se pudo enviar email al negocio para ticket #{ticket.ticket_number}")
                
            if results['customer']:
                print(f"✅ Email enviado al cliente para ticket #{ticket.ticket_number}")
            else:
                print(f"⚠️ No se pudo enviar email al cliente para ticket #{ticket.ticket_number}")
                
            if results['errors']:
                for error in results['errors']:
                    print(f"❌ Error: {error}")
                
        except Exception as e:
            print(f"❌ Error al enviar emails para ticket #{ticket.ticket_number}: {e}")
            # No fallar la creación del ticket si falla el email
            pass

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAttachFiles], parser_classes=[MultiPartParser, FormParser, JSONParser])
    def attach_file(self, request, pk=None):
        """
        Permite adjuntar archivos a un ticket (múltiples archivos soportados).
        Clientes solo pueden adjuntar a sus propios tickets.

        Soporta dos formas de envío:
        1. Multipart/form-data: enviar archivo como 'file' field (recomendado)
        2. JSON con base64: enviar 'file_name', 'content_type', 'data' (base64)

        Ejemplo multipart:
            POST /tickets/{id}/attach_file/
            Content-Type: multipart/form-data
            file: <binary file>
            role: 'image' | 'manual' | 'datasheet' | 'other' (opcional)

        Ejemplo JSON base64:
            POST /tickets/{id}/attach_file/
            Content-Type: application/json
            {
                "file_name": "document.pdf",
                "content_type": "application/pdf",
                "data": "base64_encoded_data...",
                "role": "manual"
            }
        """
        from django.core.files.base import ContentFile
        import base64

        ticket = self.get_object()

        # Verificar permiso de objeto
        self.check_object_permissions(request, ticket)

        # Obtener role (opcional)
        role = request.data.get('role', 'other')

        # Opción 1: Archivo multipart (recomendado)
        file_obj = request.FILES.get('file')

        if file_obj:
            try:
                # Inferir role por MIME si no se especificó
                if role == 'other' and file_obj.content_type:
                    if file_obj.content_type.startswith('image/'):
                        role = 'image'
                    elif 'pdf' in file_obj.content_type:
                        role = 'manual'

                # Crear attachment desde archivo multipart
                ticket_ct = ContentType.objects.get_for_model(ServiceTicket)
                attachment = Attachment.objects.create(
                    file=file_obj,
                    role=role,
                    content_type_str=file_obj.content_type or 'application/octet-stream',
                    content_type=ticket_ct,
                    object_id=ticket.id,
                    attachable_type='ServiceTicket',  # legacy
                    attachable_id=ticket.id,  # legacy
                    created_by=request.user
                )

                # Si es el primer attachment, establecerlo como principal
                if not ticket.attachment:
                    ticket.attachment = attachment
                    ticket.save()

                return Response({
                    'message': 'File attached successfully',
                    'attachment_id': str(attachment.id),
                    'ticket_number': ticket.ticket_number,
                    'file_name': attachment.file_name,
                    'url': request.build_absolute_uri(attachment.url) if attachment.url else None,
                    'role': attachment.role
                }, status=status.HTTP_201_CREATED)

            except Exception as e:
                return Response(
                    {'error': f'Error uploading file: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Opción 2: Base64 (para compatibilidad con clientes antiguos)
        file_name = request.data.get('file_name')
        content_type = request.data.get('content_type')
        data_base64 = request.data.get('data')

        if not file_name or not data_base64:
            return Response(
                {'error': 'Either "file" (multipart) or "file_name" + "data" (base64) are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Decodificar base64
            file_data = base64.b64decode(data_base64)
            django_file = ContentFile(file_data, name=file_name)

            # Inferir role por MIME si no se especificó
            if role == 'other' and content_type:
                if content_type.startswith('image/'):
                    role = 'image'
                elif 'pdf' in content_type:
                    role = 'manual'

            # Crear attachment
            ticket_ct = ContentType.objects.get_for_model(ServiceTicket)
            attachment = Attachment.objects.create(
                file=django_file,
                role=role,
                content_type_str=content_type or 'application/octet-stream',
                content_type=ticket_ct,
                object_id=ticket.id,
                attachable_type='ServiceTicket',  # legacy
                attachable_id=ticket.id,  # legacy
                created_by=request.user
            )

            # Si es el primer attachment, establecerlo como principal
            if not ticket.attachment:
                ticket.attachment = attachment
                ticket.save()

            return Response({
                'message': 'File attached successfully',
                'attachment_id': str(attachment.id),
                'ticket_number': ticket.ticket_number,
                'file_name': attachment.file_name,
                'url': request.build_absolute_uri(attachment.url) if attachment.url else None,
                'role': attachment.role
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Error processing base64 file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAttachFiles], parser_classes=[MultiPartParser, FormParser])
    def attach_files(self, request, pk=None):
        """
        Permite adjuntar MÚLTIPLES archivos a un ticket en una sola petición.
        Clientes solo pueden adjuntar a sus propios tickets.

        Ejemplo multipart:
            POST /tickets/{id}/attach_files/
            Content-Type: multipart/form-data
            files: [<binary file 1>, <binary file 2>, ...]
            role: 'image' | 'manual' | 'datasheet' | 'other' (opcional, aplica a todos)

        Retorna lista de attachments creados.
        """
        ticket = self.get_object()

        # Verificar permiso de objeto
        self.check_object_permissions(request, ticket)

        # Obtener todos los archivos
        files = request.FILES.getlist('files')  # getlist para múltiples archivos

        if not files:
            return Response(
                {'error': 'No files provided. Use "files" field for multiple files.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener role (opcional, aplica a todos los archivos)
        role = request.data.get('role', 'other')

        attachments_created = []
        errors = []

        for file_obj in files:
            try:
                # Inferir role por MIME si no se especificó
                current_role = role
                if current_role == 'other' and file_obj.content_type:
                    if file_obj.content_type.startswith('image/'):
                        current_role = 'image'
                    elif 'pdf' in file_obj.content_type:
                        current_role = 'manual'

                # Crear attachment
                ticket_ct = ContentType.objects.get_for_model(ServiceTicket)
                attachment = Attachment.objects.create(
                    file=file_obj,
                    role=current_role,
                    content_type_str=file_obj.content_type or 'application/octet-stream',
                    content_type=ticket_ct,
                    object_id=ticket.id,
                    attachable_type='ServiceTicket',  # legacy
                    attachable_id=ticket.id,  # legacy
                    created_by=request.user
                )

                # Si es el primer attachment y el ticket no tiene uno principal
                if not ticket.attachment and len(attachments_created) == 0:
                    ticket.attachment = attachment
                    ticket.save()

                attachments_created.append({
                    'attachment_id': str(attachment.id),
                    'file_name': attachment.file_name,
                    'url': request.build_absolute_uri(attachment.url) if attachment.url else None,
                    'role': attachment.role,
                    'size_bytes': attachment.size_bytes
                })

            except Exception as e:
                errors.append({
                    'file_name': file_obj.name,
                    'error': str(e)
                })

        return Response({
            'message': f'{len(attachments_created)} file(s) attached successfully',
            'ticket_number': ticket.ticket_number,
            'attachments': attachments_created,
            'errors': errors
        }, status=status.HTTP_201_CREATED if attachments_created else status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], url_path='attachments/(?P<attachment_id>[^/.]+)', permission_classes=[IsAuthenticated, CanAttachFiles])
    def delete_attachment(self, request, pk=None, attachment_id=None):
        """
        Elimina un attachment específico de un ticket.
        Clientes solo pueden eliminar attachments de sus propios tickets.

        Ejemplo:
            DELETE /tickets/{ticket_id}/attachments/{attachment_id}/
        """
        ticket = self.get_object()

        # Verificar permiso de objeto
        self.check_object_permissions(request, ticket)

        try:
            # Buscar el attachment
            attachment = Attachment.objects.get(
                id=attachment_id,
                attachable_type='ServiceTicket',
                attachable_id=ticket.id
            )

            # Guardar info antes de eliminar
            file_name = attachment.file_name

            # Si es el attachment principal del ticket, quitarlo
            if ticket.attachment and ticket.attachment.id == attachment.id:
                ticket.attachment = None
                ticket.save()

            # Eliminar el archivo físico si existe
            if attachment.file:
                try:
                    attachment.file.delete()
                except Exception:
                    pass

            # Eliminar el registro
            attachment.delete()

            return Response({
                'message': 'Attachment deleted successfully',
                'file_name': file_name
            }, status=status.HTTP_200_OK)

        except Attachment.DoesNotExist:
            return Response(
                {'error': 'Attachment not found or does not belong to this ticket'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error deleting attachment: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, CanAttachFiles])
    def list_attachments(self, request, pk=None):
        """
        Lista todos los attachments de un ticket.
        Clientes solo pueden ver attachments de sus propios tickets.

        Ejemplo:
            GET /tickets/{id}/list_attachments/

        Nota: Los attachments también se incluyen automáticamente en el serializer del ticket.
        """
        ticket = self.get_object()

        # Verificar permiso de objeto
        self.check_object_permissions(request, ticket)

        # Buscar todos los attachments del ticket
        attachments = Attachment.objects.filter(
            attachable_type='ServiceTicket',
            attachable_id=ticket.id
        ).order_by('-created_at')

        from attachments.serializers import AttachmentSerializer
        serializer = AttachmentSerializer(attachments, many=True, context={'request': request})

        return Response({
            'ticket_number': ticket.ticket_number,
            'total_attachments': attachments.count(),
            'attachments': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrBackOffice])
    def assign(self, request, pk=None):
        """Asignar ticket a un usuario (solo admin/backoffice)"""
        ticket = self.get_object()
        user_id = request.data.get('assigned_user')

        if not user_id:
            return Response(
                {'error': 'assigned_user is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(
            ticket,
            data={'assigned_user': user_id},
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrBackOffice])
    def start(self, request, pk=None):
        """Marcar ticket como en progreso (solo admin/backoffice)"""
        ticket = self.get_object()

        try:
            in_progress_state = TicketState.objects.get(id='in_progress')
        except TicketState.DoesNotExist:
            return Response(
                {'error': 'State "in_progress" does not exist'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(
            ticket,
            data={'state': in_progress_state.id},
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrBackOffice])
    def resolve(self, request, pk=None):
        """Marcar ticket como resuelto (solo admin/backoffice)"""
        ticket = self.get_object()
        resolution_notes = request.data.get('resolution_notes', '')

        try:
            resolved_state = TicketState.objects.get(id='resolved')
        except TicketState.DoesNotExist:
            return Response(
                {'error': 'State "resolved" does not exist'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(
            ticket,
            data={
                'state': resolved_state.id,
                'resolution_notes': resolution_notes
            },
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrBackOffice])
    def close(self, request, pk=None):
        """Cerrar ticket (solo admin/backoffice)"""
        ticket = self.get_object()

        try:
            closed_state = TicketState.objects.get(id='closed')
        except TicketState.DoesNotExist:
            return Response(
                {'error': 'State "closed" does not exist'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(
            ticket,
            data={'state': closed_state.id},
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminOrBackOffice])
    def statistics(self, request):
        """Obtener estadísticas de tickets (solo admin/backoffice)"""
        from django.db.models import Count, Q
        from datetime import timedelta
        from django.utils import timezone

        total = self.get_queryset().count()
        by_state = dict(
            self.get_queryset()
            .values('state__name')
            .annotate(count=Count('id'))
            .values_list('state__name', 'count')
        )
        by_priority = dict(
            self.get_queryset()
            .values('priority__name')
            .annotate(count=Count('id'))
            .values_list('priority__name', 'count')
        )

        # Tickets sin asignar
        unassigned = self.get_queryset().filter(assigned_user__isnull=True).count()

        # Tickets creados en los últimos 7 días
        week_ago = timezone.now() - timedelta(days=7)
        recent = self.get_queryset().filter(created_at__gte=week_ago).count()

        return Response({
            'total': total,
            'by_state': by_state,
            'by_priority': by_priority,
            'unassigned': unassigned,
            'created_last_7_days': recent
        })