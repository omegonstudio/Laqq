import django_filters
from .models import ServiceTicket


class ServiceTicketFilter(django_filters.FilterSet):
    """
    Filtro personalizado para ServiceTicket que permite usar ?email=
    en lugar de ?contact__email= para mejor usabilidad
    """
    email = django_filters.CharFilter(field_name='contact__email', lookup_expr='exact')

    class Meta:
        model = ServiceTicket
        fields = ['contact', 'product', 'state', 'priority', 'assigned_user']
