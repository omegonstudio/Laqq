from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.contenttypes.models import ContentType

from .models import ServiceTicket, TicketState, TicketPriority
from .serializers import (
    ServiceTicketSerializer,
    TicketStateSerializer,
    TicketPrioritySerializer
)
from .permissions import (
    IsAdminOrBackOffice,
    CanAttachFiles,
    CanCreateTicketOrStaff
)

from attachments.models import Attachment
from .emails import send_ticket_created_email

import secrets
import string


# -------------------------
# Ticket State
# -------------------------

class TicketStateViewSet(viewsets.ModelViewSet):
    queryset = TicketState.objects.all()
    serializer_class = TicketStateSerializer
    permission_classes = [IsAuthenticated, IsAdminOrBackOffice]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name', 'is_final']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


# -------------------------
# Ticket Priority
# -------------------------

class TicketPriorityViewSet(viewsets.ModelViewSet):
    queryset = TicketPriority.objects.all()
    serializer_class = TicketPrioritySerializer
    permission_classes = [IsAuthenticated, IsAdminOrBackOffice]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name', 'level']
    search_fields = ['name', 'description']
    ordering_fields = ['level', 'name', 'created_at']
    ordering = ['-level']


# -------------------------
# Service Tickets
# -------------------------

class ServiceTicketViewSet(viewsets.ModelViewSet):
    queryset = ServiceTicket.objects.all()
    serializer_class = ServiceTicketSerializer
    permission_classes = [CanCreateTicketOrStaff]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = [
        'contact',
        'contact__email',
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

    # -------------------------
    # Permissions dinámicos
    # -------------------------

    def get_permissions(self):
        # GET público (listar / detalle)
        if self.request.method == 'GET':
            return [AllowAny()]

        return super().get_permissions()

    # -------------------------
    # Queryset filtering (por email)
    # -------------------------

    def get_queryset(self):
        """
        GET público:
        - requiere ?email=
        - devuelve solo tickets de ese email

        Usuarios autenticados:
        - admin/backoffice: ven todos los tickets
        - usuarios normales: solo ven sus propios tickets (filtrados por email)
        """
        queryset = ServiceTicket.objects.all()
        request = self.request
        user = request.user

        # GET público sin auth → filtrar por email obligatorio
        if request.method == 'GET' and not user.is_authenticated:
            email = request.query_params.get('email')

            if not email:
                return queryset.none()

            return queryset.filter(contact__email=email)

        # Usuario autenticado
        if user.is_authenticated:
            # Admin/backoffice → todos los tickets
            if user.is_superuser or user.user_type_id in ['ADMIN', 'BACKOFFICE', 'admin', 'back']:
                return queryset

            # Usuario normal → solo sus propios tickets
            return queryset.filter(contact__email=user.email)

        return queryset.none()

    # -------------------------
    # Create
    # -------------------------

    def perform_create(self, serializer):
        ticket = serializer.save()

        contact = ticket.contact
        username = contact.email
        password = ''.join(
            secrets.choice(string.ascii_letters + string.digits)
            for _ in range(12)
        )

        try:
            send_ticket_created_email(ticket, username, password)
        except Exception as e:
            print(f"❌ Error enviando email para ticket {ticket.ticket_number}: {e}")

    # -------------------------
    # Attach single file
    # -------------------------

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanAttachFiles],
        parser_classes=[MultiPartParser, FormParser, JSONParser]
    )
    def attach_file(self, request, pk=None):
        from django.core.files.base import ContentFile
        import base64

        ticket = self.get_object()
        role = request.data.get('role', 'other')
        file_obj = request.FILES.get('file')

        ticket_ct = ContentType.objects.get_for_model(ServiceTicket)

        if file_obj:
            attachment = Attachment.objects.create(
                file=file_obj,
                role=role,
                content_type_str=file_obj.content_type or 'application/octet-stream',
                content_type=ticket_ct,
                object_id=ticket.id,
                attachable_type='ServiceTicket',
                attachable_id=ticket.id,
                created_by=request.user
            )
        else:
            file_name = request.data.get('file_name')
            data_base64 = request.data.get('data')
            content_type = request.data.get('content_type')

            if not file_name or not data_base64:
                return Response(
                    {'error': 'File data missing'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            file_data = base64.b64decode(data_base64)
            django_file = ContentFile(file_data, name=file_name)

            attachment = Attachment.objects.create(
                file=django_file,
                role=role,
                content_type_str=content_type or 'application/octet-stream',
                content_type=ticket_ct,
                object_id=ticket.id,
                attachable_type='ServiceTicket',
                attachable_id=ticket.id,
                created_by=request.user
            )

        if not ticket.attachment:
            ticket.attachment = attachment
            ticket.save()

        return Response(
            {
                'message': 'File attached successfully',
                'attachment_id': str(attachment.id),
                'file_name': attachment.file_name,
                'url': request.build_absolute_uri(attachment.url) if attachment.url else None
            },
            status=status.HTTP_201_CREATED
        )

    # -------------------------
    # Assign / state changes
    # -------------------------

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrBackOffice])
    def assign(self, request, pk=None):
        ticket = self.get_object()
        serializer = self.get_serializer(
            ticket,
            data={'assigned_user': request.data.get('assigned_user')},
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrBackOffice])
    def start(self, request, pk=None):
        state = TicketState.objects.get(id='in_progress')
        serializer = self.get_serializer(self.get_object(), data={'state': state.id}, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrBackOffice])
    def resolve(self, request, pk=None):
        state = TicketState.objects.get(id='resolved')
        serializer = self.get_serializer(
            self.get_object(),
            data={
                'state': state.id,
                'resolution_notes': request.data.get('resolution_notes', '')
            },
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrBackOffice])
    def close(self, request, pk=None):
        state = TicketState.objects.get(id='closed')
        serializer = self.get_serializer(self.get_object(), data={'state': state.id}, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    # -------------------------
    # Statistics
    # -------------------------

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminOrBackOffice])
    def statistics(self, request):
        from django.db.models import Count
        from datetime import timedelta
        from django.utils import timezone

        qs = self.get_queryset()
        week_ago = timezone.now() - timedelta(days=7)

        return Response({
            'total': qs.count(),
            'by_state': dict(qs.values_list('state__name').annotate(count=Count('id'))),
            'by_priority': dict(qs.values_list('priority__name').annotate(count=Count('id'))),
            'unassigned': qs.filter(assigned_user__isnull=True).count(),
            'created_last_7_days': qs.filter(created_at__gte=week_ago).count()
        })
