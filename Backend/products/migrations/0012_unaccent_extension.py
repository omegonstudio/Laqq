from django.contrib.postgres.operations import UnaccentExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0011_remove_dimensions_ordering_created_at'),
    ]

    operations = [
        UnaccentExtension(),
    ]
