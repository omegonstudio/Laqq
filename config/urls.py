from django.contrib import admin
from django.urls import path, include

urlpatterns = [
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