"""
Dashboard Summary API
Provides aggregated statistics for the backoffice dashboard.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from products.models import Product
from quotes.models import Quote
from contacts.models import Message
from tickets.models import ServiceTicket

User = get_user_model()


@swagger_auto_schema(
    method='get',
    operation_description="Get dashboard summary statistics and recent activity",
    operation_summary="Dashboard Summary",
    tags=['Dashboard'],
    responses={
        200: openapi.Response(
            description="Dashboard statistics and recent activity",
            examples={
                "application/json": {
                    "stats": {
                        "active_users": 24,
                        "products": 156,
                        "quotes": 48,
                        "new_messages": 12
                    },
                    "recent_activity": [
                        {
                            "type": "quote",
                            "title": "Nueva cotización de Laboratorio Central",
                            "time_ago": "Hace 2 horas",
                            "quote_number": "Q-2025-00001",
                            "contact": "Laboratorio Central",
                            "state": "Draft"
                        }
                    ]
                }
            }
        ),
        401: "Authentication required"
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """
    Returns aggregated statistics for the dashboard:
    - Active users count
    - Total products count
    - Total quotes count
    - New messages count (unread)
    - Recent activity (last quotes, messages, products updated)
    """

    # 1. Usuarios Activos
    active_users_count = User.objects.filter(is_active=True).exclude(user_type__id='client').count()

    # 2. Productos Totales
    products_count = Product.objects.filter(is_active=True).count()

    # 3. Cotizaciones Totales
    quotes_count = Quote.objects.all().count()

    # 4. Mensajes Nuevos (últimos 7 días)
    seven_days_ago = timezone.now() - timedelta(days=7)
    new_messages_count = Message.objects.filter(created_at__gte=seven_days_ago).count()

    # 5. Actividad Reciente - Últimas 5 cotizaciones
    recent_quotes = Quote.objects.select_related(
        'contact', 'quote_type', 'state'
    ).order_by('-created_at')[:5]

    recent_quotes_data = []
    for quote in recent_quotes:
        time_diff = timezone.now() - quote.created_at
        if time_diff < timedelta(hours=1):
            time_ago = f"Hace {int(time_diff.seconds / 60)} minutos"
        elif time_diff < timedelta(days=1):
            time_ago = f"Hace {int(time_diff.seconds / 3600)} horas"
        else:
            time_ago = f"Hace {time_diff.days} día{'s' if time_diff.days > 1 else ''}"

        recent_quotes_data.append({
            'type': 'quote',
            'title': f"Nueva cotización de {quote.contact.company_name or quote.contact.first_name}",
            'time_ago': time_ago,
            'quote_number': quote.quote_number,
            'contact': quote.contact.company_name or f"{quote.contact.first_name} {quote.contact.last_name}",
            'state': quote.state.name if quote.state else None,
        })

    # 6. Mensajes Recientes - Últimos 5 mensajes
    recent_messages = Message.objects.order_by('-created_at')[:5]

    recent_messages_data = []
    for message in recent_messages:
        time_diff = timezone.now() - message.created_at
        if time_diff < timedelta(hours=1):
            time_ago = f"Hace {int(time_diff.seconds / 60)} minutos"
        elif time_diff < timedelta(days=1):
            time_ago = f"Hace {int(time_diff.seconds / 3600)} horas"
        else:
            time_ago = f"Hace {time_diff.days} día{'s' if time_diff.days > 1 else ''}"

        recent_messages_data.append({
            'type': 'message',
            'title': f"Mensaje nuevo de {message.company_name or message.first_name}",
            'time_ago': time_ago,
            'company': message.company_name,
            'first_name': message.first_name,
            'last_name': message.last_name,
        })

    # 7. Productos Actualizados Recientemente - Últimos 5
    recent_products = Product.objects.select_related(
        'brand', 'category'
    ).order_by('-updated_at')[:5]

    recent_products_data = []
    for product in recent_products:
        time_diff = timezone.now() - product.updated_at
        if time_diff < timedelta(hours=1):
            time_ago = f"Hace {int(time_diff.seconds / 60)} minutos"
        elif time_diff < timedelta(days=1):
            time_ago = f"Hace {int(time_diff.seconds / 3600)} horas"
        else:
            time_ago = f"Hace {time_diff.days} día{'s' if time_diff.days > 1 else ''}"

        recent_products_data.append({
            'type': 'product',
            'title': f"Producto actualizado: {product.name}",
            'time_ago': time_ago,
            'product_name': product.name,
            'brand': product.brand.name if product.brand else None,
            'category': product.category.name if product.category else None,
        })

    # 8. Combinar actividad reciente y ordenar por fecha
    all_recent_activity = (
        recent_quotes_data +
        recent_messages_data +
        recent_products_data
    )

    # No necesitamos ordenar porque ya traemos ordenados por fecha
    # Pero limitamos a 10 items más recientes
    all_recent_activity = all_recent_activity[:10]

    return Response({
        'stats': {
            'active_users': active_users_count,
            'products': products_count,
            'quotes': quotes_count,
            'new_messages': new_messages_count,
        },
        'recent_activity': all_recent_activity,
    })
