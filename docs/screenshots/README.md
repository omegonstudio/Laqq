# Capturas del Manual de Usuario

PNG referenciados en `docs/MANUAL_USUARIO.md`.

## Regenerar

Prerrequisitos: stack DEV arriba (`./scripts/dev-up.sh`) con seed (`LOAD_SEED_DATA=true`).

```bash
cd Frontend
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run screenshots:manual
```

Credenciales demo (opcionales; por defecto seed documentado en `docs/DEV_SETUP.md`):

```bash
LAQQ_DEMO_USERNAME=admin LAQQ_DEMO_PASSWORD=admin123 npm run screenshots:manual
```

Script: `Frontend/tests/manual-user-screenshots.spec.ts`

## Checklist

| Archivo | Pantalla / módulo | Estado |
|---------|-------------------|--------|
| `01-login.png` | Acceso BackOffice (`/login`) | Hecho |
| `02-catalogo.png` | Catálogo de Productos | Hecho |
| `03-detalle-producto.png` | Detalle de producto | Hecho |
| `04-marca.png` | Página de marca | Hecho |
| `05-cotizacion.png` | Solicitar Cotización | Hecho |
| `06-soporte.png` | Servicio Técnico | Hecho |
| `07-tickets-cliente.png` | Portal `/tickets` | Hecho |
| `08-certificados.png` | Búsqueda de Certificados | Hecho |
| `09-contacto.png` | Contacto | Hecho |
| `10-empresa.png` | Empresa | Hecho |
| `11-mobiliario.png` | Mobiliario | Hecho |
| `12-dashboard.png` | Dashboard backoffice | Hecho |
| `13-usuarios.png` | Gestión de Usuarios | Hecho |
| `14-productos.png` | Gestión de Productos | Hecho |
| `15-cotizaciones.png` | Gestión de Cotizaciones | Hecho |
| `16-mensajes.png` | Administrador de Mensajes | Hecho |
| `17-marcas.png` | Gestión de Marcas | Hecho |
| `18-categorias.png` | Gestión de Categorías | Hecho |
| `19-contactos.png` | Gestión de Contactos | Hecho |
| `20-tickets-bo.png` | Tickets de servicio (BO) | Hecho |
| `21-libreria.png` | Librería | Hecho |

## Tips

- Viewport: 1440×900, PNG.
- En backoffice, sidebar visible.
- Usar datos demo; revisar filas con emails no-seed antes de publicar.
