# Generated manually for GenericForeignKey support

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('attachments', '0004_attachment_role_alter_attachment_attachable_id_and_more'),
    ]

    operations = [
        # Rename content_type to content_type_str (MIME type field)
        migrations.RenameField(
            model_name='attachment',
            old_name='content_type',
            new_name='content_type_str',
        ),
        # Add new content_type field for GenericForeignKey (ContentType FK)
        migrations.AddField(
            model_name='attachment',
            name='content_type',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to='contenttypes.contenttype'
            ),
        ),
        # Add object_id field for GenericForeignKey
        migrations.AddField(
            model_name='attachment',
            name='object_id',
            field=models.UUIDField(blank=True, null=True, db_index=True),
        ),
    ]
