# Generated manually to create missing 'client' UserType

from django.db import migrations


def create_client_usertype(apps, schema_editor):
    """Create the 'client' UserType if it doesn't exist"""
    UserType = apps.get_model('users', 'UserType')

    # Create client UserType if it doesn't exist
    UserType.objects.get_or_create(
        id='client',
        defaults={
            'name': 'Cliente',
            'description': 'Usuario cliente del portal de tickets',
            'permissions': {
                'tickets': {
                    'view_own': True,
                    'create': False,
                    'update': False,
                    'delete': False
                },
                'attachments': {
                    'view_own': True,
                    'upload_own': True,
                    'delete_own': False
                }
            }
        }
    )


def reverse_migration(apps, schema_editor):
    """Remove the 'client' UserType"""
    UserType = apps.get_model('users', 'UserType')
    UserType.objects.filter(id='client').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_user'),
    ]

    operations = [
        migrations.RunPython(create_client_usertype, reverse_migration),
    ]
