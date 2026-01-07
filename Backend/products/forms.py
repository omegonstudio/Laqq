from django import forms

class CSVUploadForm(forms.Form):
    csv_file = forms.FileField(label='Archivo CSV', required=True)
    encoding = forms.CharField(max_length=32, initial='utf-8', required=False)
    create_missing = forms.BooleanField(initial=True, required=False, label='Crear marcas/categorías faltantes')
    skip_downloads = forms.BooleanField(initial=False, required=False, label='Omitir descarga de imágenes (solo pruebas)')