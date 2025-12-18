from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import ServiceTicket, TicketState, TicketPriority
from .serializers import ServiceTicketSerializer, TicketStateSerializer, TicketPrioritySerializer
from .permissions import IsAdminOrBackOffice, IsClientOwnerOrStaff, CanAttachFiles
from attachments.models import Attachment

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
    permission_classes = [IsAuthenticated, IsClientOwnerOrStaff]
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
        - Clientes: solo ven sus propios tickets (basado en email)
        - Admin/BackOffice: ven todos los tickets
        """
        user = self.request.user
        queryset = super().get_queryset()

        if user.user_type_id == 'client':
            # Filtrar solo tickets del cliente (matching por email)
            queryset = queryset.filter(contact__email=user.email)

        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAttachFiles])
    def attach_file(self, request, pk=None):
        """
        Permite adjuntar archivos a un ticket.
        Clientes solo pueden adjuntar a sus propios tickets.
        """
        ticket = self.get_object()

        # Verificar permiso de objeto
        self.check_object_permissions(request, ticket)

        # Obtener datos del archivo
        file_name = request.data.get('file_name')
        content_type = request.data.get('content_type')
        data = request.data.get('data')  # Binary data or base64 string

        if not file_name:
            return Response(
                {'error': 'file_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Crear attachment
            attachment = Attachment.objects.create(
                file_name=file_name,
                content_type=content_type or 'application/octet-stream',
                data=data,
                attachable_type='ServiceTicket',
                attachable_id=ticket.id,
                created_by=request.user
            )

            # Asociar attachment al ticket
            ticket.attachment = attachment
            ticket.save()

            return Response({
                'message': 'File attached successfully',
                'attachment_id': str(attachment.id),
                'ticket_number': ticket.ticket_number,
                'file_name': attachment.file_name
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

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