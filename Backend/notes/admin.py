from django.contrib import admin
from .models import NoteType, NoteState, Note

@admin.register(NoteType)
class NoteTypeAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'description', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(NoteState)
class NoteStateAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'color', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'note_type', 'state', 'author', 'published_at', 'created_at']
    search_fields = ['title', 'summary', 'content']
    list_filter = ['note_type', 'state', 'author']
    ordering = ['-created_at']
