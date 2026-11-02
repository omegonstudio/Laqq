# Diagramas — Manual de arquitectura

PNG generados desde Mermaid (`@mermaid-js/mermaid-cli`) para `docs/MANUAL_ARQUITECTURA.md`.

| Archivo | Sección |
|---------|---------|
| `01-alto-nivel.png` | Arquitectura de alto nivel (producción) |
| `02-auth-jwt.png` | Flujo de autenticación JWT |
| `03-integraciones.png` | Integraciones externas |
| `04-dependencias.png` | Dependencias entre dominios backend |
| `05-modelo-datos.png` | Modelo de datos (ER) |

Para regenerar (desde esta carpeta o con los `.mmd` en `/tmp`):

```bash
npx --yes @mermaid-js/mermaid-cli@11 -i diagrama.mmd -o salida.png -b transparent -s 2
```
