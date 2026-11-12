from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import HttpResponse

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.contenttypes.models import ContentType

from .models import ServiceTicket, TicketState, TicketPriority
from .serializers import (
    ServiceTicketSerializer,
    TicketStateSerializer,
    TicketPrioritySerializer,
    TicketPackageSerializer,
    get_service_ticket_serializer_class,
)
from .permissions import (
    IsAdminOrBackOffice,
    CanRunTicketWorkflow,
    CanReopenOrClassifyTicket,
    CanExportTickets,
    IsAdminOnly,
    CanAttachFiles,
    CanCreateTicketOrStaff,
    TICKET_VIEW_ALL,
    user_can_access_internal_notes,
)
from .filters import ServiceTicketFilter
from .workflow import transition_ticket, reopen_ticket, classify_ticket

from attachments.models import Attachment
from .emails import (
    send_ticket_status_change_email,
    send_ticket_assigned_email,
)

import logging

logger = logging.getLogger(__name__)


def _serialize_ticket(request, ticket):
    serializer_class = get_service_ticket_serializer_class(request)
    return serializer_class(ticket, context={'request': request}).data


def _send_status_email_safe(ticket):
    try:
        send_ticket_status_change_email(ticket)
    except Exception as e:
        logger.error(
            f"Error sending status change email for ticket {ticket.ticket_number}: {e}"
        )


# -------------------------
# Ticket State
# -------------------------

class TicketStateViewSet(viewsets.ModelViewSet):
    queryset = TicketState.objects.all()
    serializer_class = TicketStateSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name', 'is_final']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminOnly()]


# -------------------------
# Ticket Priority (catálogo histórico; UI ST no lo usa)
# -------------------------

class TicketPriorityViewSet(viewsets.ModelViewSet):
    queryset = TicketPriority.objects.all()
    serializer_class = TicketPrioritySerializer

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name', 'level']
    search_fields = ['name', 'description']
    ordering_fields = ['level', 'name', 'created_at']
    ordering = ['-level']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated(), IsAdminOrBackOffice()]
        return [IsAuthenticated(), IsAdminOnly()]


# -------------------------
# Service Tickets
# -------------------------

class ServiceTicketViewSet(viewsets.ModelViewSet):
    queryset = ServiceTicket.objects.all()
    serializer_class = ServiceTicketSerializer
    permission_classes = [CanCreateTicketOrStaff]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ServiceTicketFilter

    search_fields = [
        'ticket_number',
        'product_name',
        'description',
        'resolution_notes',
    ]

    ordering_fields = [
        'ticket_number',
        'created_at',
        'updated_at',
        'assigned_at',
        'started_at',
        'diagnosed_at',
        'quoted_at',
        'resolved_at',
        'closed_at',
        'priority__level',
    ]

    ordering = ['-created_at']

    def get_permissions(self):
        action = getattr(self, 'action', None)
        # Acciones con permisos propios (el override de GET no debe anularlos)
        if action == 'export':
            return [IsAuthenticated(), CanExportTickets()]
        if action in (
            'assign', 'start', 'diagnose', 'resolve', 'quote', 'close',
        ):
            return [IsAuthenticated(), CanRunTicketWorkflow()]
        if action in ('reopen', 'classify'):
            return [IsAuthenticated(), CanReopenOrClassifyTicket()]
        if action == 'statistics':
            return [IsAuthenticated(), IsAdminOrBackOffice()]
        if action == 'attach_file':
            return [IsAuthenticated(), CanAttachFiles()]
        if action == 'create_from_package':
            return [AllowAny()]
        if self.request.method == 'GET':
            return [AllowAny()]
        return super().get_permissions()

    def get_serializer_class(self):
        return get_service_ticket_serializer_class(self.request)

    def get_queryset(self):
        queryset = ServiceTicket.objects.all()
        request = self.request
        user = request.user

        if request.method == 'GET' and not user.is_authenticated:
            email = request.query_params.get('email')
            if not email:
                return queryset.none()
            return queryset.filter(contact__email=email)

        if user.is_authenticated:
            if user.is_superuser or (
                user.user_type_id and user.user_type_id in TICKET_VIEW_ALL
            ):
                return queryset
            return queryset.filter(contact__email=user.email)

        return queryset.none()

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
        file_obj = request.FILES.get('file')

        explicit_role = request.data.get('role')
        if explicit_role:
            role = explicit_role
        elif file_obj and file_obj.content_type and file_obj.content_type.startswith('image/'):
            role = 'image'
        else:
            role = 'other'

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
    # Assign (no cambia estado)
    # -------------------------

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanRunTicketWorkflow])
    def assign(self, request, pk=None):
        ticket = self.get_object()
        previous_assigned_user_id = ticket.assigned_user_id
        previous_state_id = ticket.state_id

        data = {'assigned_user_id': request.data.get('assigned_user')}
        serializer = self.get_serializer(ticket, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        ticket.refresh_from_db()

        # Invariante T9: assign no modifica estado
        if ticket.state_id != previous_state_id:
            ticket.state_id = previous_state_id
            ticket.save(update_fields=['state', 'updated_at'])
            ticket.refresh_from_db()

        new_assigned_user_id = ticket.assigned_user_id
        assignee_changed = previous_assigned_user_id != new_assigned_user_id

        if assignee_changed and new_assigned_user_id is not None:
            try:
                send_ticket_assigned_email(ticket)
            except Exception as e:
                logger.error(
                    f"Error sending assignment email for ticket {ticket.ticket_number}: {e}"
                )

        _send_status_email_safe(ticket)
        return Response(_serialize_ticket(request, ticket))

    # -------------------------
    # Workflow operativo
    # -------------------------

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanRunTicketWorkflow])
    def start(self, request, pk=None):
        """Alias de diagnosticar: received → diagnosed."""
        ticket = transition_ticket(self.get_object(), 'diagnose')
        _send_status_email_safe(ticket)
        return Response(_serialize_ticket(request, ticket))

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanRunTicketWorkflow])
    def diagnose(self, request, pk=None):
        ticket = transition_ticket(self.get_object(), 'diagnose')
        _send_status_email_safe(ticket)
        return Response(_serialize_ticket(request, ticket))

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanRunTicketWorkflow])
    def resolve(self, request, pk=None):
        """Alias de presupuestar: diagnosed → quoted."""
        ticket = transition_ticket(
            self.get_object(),
            'quote',
            resolution_notes=request.data.get('resolution_notes'),
        )
        _send_status_email_safe(ticket)
        return Response(_serialize_ticket(request, ticket))

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanRunTicketWorkflow])
    def quote(self, request, pk=None):
        ticket = transition_ticket(
            self.get_object(),
            'quote',
            resolution_notes=request.data.get('resolution_notes'),
        )
        _send_status_email_safe(ticket)
        return Response(_serialize_ticket(request, ticket))

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanRunTicketWorkflow])
    def close(self, request, pk=None):
        ticket = transition_ticket(self.get_object(), 'close')
        _send_status_email_safe(ticket)
        return Response(_serialize_ticket(request, ticket))

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanReopenOrClassifyTicket],
    )
    def reopen(self, request, pk=None):
        ticket = reopen_ticket(self.get_object())
        _send_status_email_safe(ticket)
        return Response(_serialize_ticket(request, ticket))

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanReopenOrClassifyTicket],
    )
    def classify(self, request, pk=None):
        to_state = request.data.get('state')
        if not to_state:
            return Response(
                {'state': 'Campo "state" operativo requerido'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ticket = classify_ticket(self.get_object(), to_state)
        return Response(_serialize_ticket(request, ticket))

    # -------------------------
    # Export
    # -------------------------

    @action(
        detail=False,
        methods=['get'],
        url_path='export',
        permission_classes=[IsAuthenticated, CanExportTickets],
    )
    def export(self, request):
        from .exporter import build_tickets_workbook, export_queryset

        queryset = self.filter_queryset(export_queryset())
        include_notes = user_can_access_internal_notes(request.user)
        try:
            buffer = build_tickets_workbook(
                queryset,
                include_internal_notes=include_notes,
            )
        except ImportError:
            return Response(
                {'error': 'openpyxl no está instalado en el servidor.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(
            buffer.getvalue(),
            content_type=(
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ),
        )
        response['Content-Disposition'] = 'attachment; filename="tickets.xlsx"'
        return response

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

    # -------------------------
    # Public ticket creation
    # -------------------------

    @action(detail=False, methods=['post'], url_path='from-package', permission_classes=[AllowAny])
    def create_from_package(self, request):
        serializer = TicketPackageSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(serializer.to_representation(result), status=status.HTTP_201_CREATED)
