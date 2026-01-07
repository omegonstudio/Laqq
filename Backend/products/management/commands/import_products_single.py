from django.core.management.base import BaseCommand, CommandError
from products.importer import import_products_csv

class Command(BaseCommand):
    help = "Import products from a single CSV (wrapper that uses products.importer.import_products_csv)"

    def add_arguments(self, parser):
        parser.add_argument('csvfile', type=str, help='Path to CSV file')
        parser.add_argument('--skip-downloads', action='store_true', help='Skip downloading images')

    def handle(self, *args, **options):
        path = options['csvfile']
        skip = options.get('skip_downloads', False)
        try:
            with open(path, 'rb') as f:
                summary = import_products_csv(f, skip_downloads=skip)
            self.stdout.write(self.style.SUCCESS("Import finalizado"))
            import json
            self.stdout.write(json.dumps(summary, indent=2, ensure_ascii=False))
        except FileNotFoundError:
            raise CommandError(f'Archivo no encontrado: {path}')