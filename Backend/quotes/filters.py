import django_filters

from .models import Quote


class QuoteFilter(django_filters.FilterSet):
    """
    lifecycle=received → aún no gestionadas (managed_at IS NULL)
    lifecycle=managed  → ya editadas / asignadas / enviadas
    """

    lifecycle = django_filters.CharFilter(method='filter_lifecycle')

    class Meta:
        model = Quote
        fields = ['contact', 'user', 'quote_type', 'state', 'currency']

    def filter_lifecycle(self, queryset, name, value):
        value = (value or '').strip().lower()
        if value == 'received':
            return queryset.filter(managed_at__isnull=True)
        if value == 'managed':
            return queryset.filter(managed_at__isnull=False)
        return queryset
