from django.db import migrations


def create_back_office_full(apps, schema_editor):
    UserType = apps.get_model('users', 'UserType')
    UserType.objects.get_or_create(
        id='back_full',
        defaults={
            'name': 'Back Office Full',
            'description': 'Back Office con ABM completo de productos, marcas y categorías',
            'permissions': {
                'products': ['create', 'read', 'update', 'delete'],
                'quotes': ['create', 'read', 'update'],
                'tickets': ['create', 'read', 'update', 'assign'],
                'contacts': ['create', 'read', 'update'],
                'users': ['read'],
                'reports': ['read'],
            },
        },
    )


def reverse_migration(apps, schema_editor):
    UserType = apps.get_model('users', 'UserType')
    UserType.objects.filter(id='back_full').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_servicio_tecnico_usertype'),
    ]

    operations = [
        migrations.RunPython(create_back_office_full, reverse_migration),
    ]
