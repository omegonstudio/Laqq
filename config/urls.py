from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def api_root(request):
    """
    API Root - Lista de todos los endpoints disponibles
    """
    return Response({
        'admin': request.build_absolute_uri('/admin/'),
        'users': {
            'list': request.build_absolute_uri('/users/list/'),
            'types': request.build_absolute_uri('/users/types/'),
            'states': request.build_absolute_uri('/users/states/'),
            'token': request.build_absolute_uri('/users/token/'),
            'token-refresh': request.build_absolute_uri('/users/token/refresh/'),
        },
        'products': {
            'list': request.build_absolute_uri('/products/list/'),
            'brands': request.build_absolute_uri('/products/brands/'),
            'categories': request.build_absolute_uri('/products/categories/'),
            'specs': request.build_absolute_uri('/products/specs/'),
        },
        'accessories': {
            'list': request.build_absolute_uri('/accessories/list/'),
            'product-accessories': request.build_absolute_uri('/accessories/product-accessories/'),
        },
        'contacts': {
            'list': request.build_absolute_uri('/contacts/list/'),
            'states': request.build_absolute_uri('/contacts/states/'),
            'messages': request.build_absolute_uri('/contacts/messages/'),
        },
        'quotes': {
            'list': request.build_absolute_uri('/quotes/list/'),
            'types': request.build_absolute_uri('/quotes/types/'),
            'states': request.build_absolute_uri('/quotes/states/'),
            'items': request.build_absolute_uri('/quotes/items/'),
        },
        'notes': {
            'list': request.build_absolute_uri('/notes/list/'),
            'types': request.build_absolute_uri('/notes/types/'),
            'states': request.build_absolute_uri('/notes/states/'),
        },
        'tickets': {
            'list': request.build_absolute_uri('/tickets/'),
        },
        'attachments': {
            'list': request.build_absolute_uri('/attachments/'),
        },
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('users/', include('users.urls')),
    path('attachments/', include('attachments.urls')),
    path('products/', include('products.urls')),
    path('accessories/', include('accessories.urls')),
    path('contacts/', include('contacts.urls')),
    path('quotes/', include('quotes.urls')),
    path('notes/', include('notes.urls')),
    path('tickets/', include('tickets.urls')),
]