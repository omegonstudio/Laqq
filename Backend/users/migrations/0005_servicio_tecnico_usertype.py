from django.db import migrations


def create_servicio_tecnico(apps, schema_editor):
    UserType = apps.get_model('users', 'UserType')
    UserType.objects.get_or_create(
        id='servicio_tecnico',
        defaults={
            'name': 'Servicio Técnico',
            'description': 'Backoffice limitado a tickets de servicio y dashboard',
            'permissions': {
                'tickets': ['create', 'read', 'update', 'assign'],
                'reports': ['read'],
            },
        },
    )


def reverse_migration(apps, schema_editor):
    UserType = apps.get_model('users', 'UserType')
    UserType.objects.filter(id='servicio_tecnico').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_create_client_usertype'),
    ]

    operations = [
        migrations.RunPython(create_servicio_tecnico, reverse_migration),
    ]
