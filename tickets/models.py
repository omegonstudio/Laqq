from django.db import models
from contacts.models import Contact
from django.contrib.auth.models import User
from attachments.models import Attachment
import uuid

class ServiceTicket(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    ticket_number = models.CharField(max_length=100, unique=True)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE)
    product_name = models.CharField(max_length=120)
    description = models.TextField()
    attachment = models.ForeignKey(Attachment, on_delete=models.SET_NULL, blank=True, null=True)
    state = models.ForeignKey('contacts.ContactState', on_delete=models.PROTECT)
    assigned_user = models.ForeignKey(User, blank=True, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)    