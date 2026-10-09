import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Regenera las 21 capturas del Manual de Usuario.
 *
 * Prerrequisitos:
 *   - Stack DEV arriba (./scripts/dev-up.sh)
 *   - Seed activo (LOAD_SEED_DATA=true) → admin/admin123
 *
 * Uso:
 *   cd Frontend
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run screenshots:manual
 *
 * Credenciales demo (opcionales; defaults = seed DEV documentado):
 *   LAQQ_DEMO_USERNAME / LAQQ_DEMO_PASSWORD
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.resolve(__dirname, "../../docs/screenshots");

const DEMO_USER = process.env.LAQQ_DEMO_USERNAME || "admin";
const DEMO_PASSWORD = process.env.LAQQ_DEMO_PASSWORD || "admin123";

/** Páginas cortas / formularios: full page. Landing largas: viewport. */
type CaptureOpts = {
  file: string;
  assert: (page: Page) => Promise<void>;
  fullPage?: boolean;
  settleMs?: number;
};

async function preparePage(page: Page) {
  await page.addStyleTag({
    content: `
      [data-sonner-toaster],
      [data-radix-toast-viewport],
      li[data-sonner-toast],
      .Toastify,
      [role="status"].toaster {
        display: none !important;
        visibility: hidden !important;
      }
    `,
  });
}

async function waitForSettled(page: Page, ms = 800) {
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  // Evitar networkidle: Turnstile / polling pueden mantener la red activa.
  await page.waitForLoadState("load").catch(() => undefined);
  await page.waitForTimeout(ms);
}

async function redactNonDemoPii(page: Page) {
  await page.evaluate(() => {
    const demoEmail = /@(example\.com|mail\.com)$/i;
    const emailRe = /[\w.+-]+@[\w.-]+\.\w+/g;
    const phoneRe = /(?:\+?\d[\d\s().-]{7,}\d)/g;

    const walk = (root: ParentNode) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let n: Node | null;
      while ((n = walker.nextNode())) nodes.push(n as Text);
      for (const textNode of nodes) {
        const raw = textNode.nodeValue || "";
        let next = raw.replace(emailRe, (m) =>
          demoEmail.test(m) ? m : "demo@example.com"
        );
        next = next.replace(phoneRe, (m) => {
          const digits = m.replace(/\D/g, "");
          return digits.length >= 8 ? "+54 11 0000-0000" : m;
        });
        if (next !== raw) textNode.nodeValue = next;
      }
    };
    walk(document.body);
  });
}

async function capture(
  page: Page,
  {
    file,
    assert,
    fullPage = false,
    settleMs = 800,
    redactPii = false,
  }: CaptureOpts & { redactPii?: boolean }
) {
  await preparePage(page);
  await waitForSettled(page, settleMs);
  await assert(page);
  if (redactPii) await redactNonDemoPii(page);

  const bodyText = await page.locator("body").innerText();
  expect(bodyText, `${file}: no debe ser 404`).not.toMatch(/404|Página no encontrada/i);
  expect(bodyText.length, `${file}: no debe estar en blanco`).toBeGreaterThan(20);

  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const out = path.join(SCREENSHOTS_DIR, file);
  await page.screenshot({ path: out, fullPage, type: "png" });

  const stat = fs.statSync(out);
  expect(stat.size, `${file}: PNG vacío`).toBeGreaterThan(5_000);
  console.log(`OK ${file} (${stat.size} bytes)`);
}

async function loginBackoffice(page: Page) {
  await page.goto("/login");
  await page.fill("#usuario", DEMO_USER);
  await page.fill("#contraseña", DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/backoffice", { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
    timeout: 30_000,
  });
}

test.describe("Manual de usuario — capturas", () => {
  test("01 — login (sin autenticar)", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto("/login");
    await capture(page, {
      file: "01-login.png",
      fullPage: true,
      assert: async (p) => {
        await expect(
          p.getByRole("heading", { name: "Acceso BackOffice" })
        ).toBeVisible();
        await expect(p.locator("#usuario")).toBeVisible();
        await expect(p.locator("#contraseña")).toBeVisible();
      },
    });
  });

  test("02 — catálogo", async ({ page }) => {
    await page.goto("/products");
    await capture(page, {
      file: "02-catalogo.png",
      fullPage: false,
      settleMs: 1200,
      assert: async (p) => {
        await expect(
          p.getByRole("heading", { name: "Catálogo de Productos" })
        ).toBeVisible();
        await expect(p.locator('a[href^="/product/"]').first()).toBeVisible({
          timeout: 30_000,
        });
      },
    });
  });

  test("03 — detalle producto", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible({
      timeout: 30_000,
    });

    // Preferir un producto con nombre legible (evitar el seed "1" si hay otros).
    const preferred = page
      .locator('a[href^="/product/"]')
      .filter({ hasText: /Micropipetas|Frascos|Celstir|Eppendorf|WHEATON/i })
      .first();
    if (await preferred.count()) {
      await preferred.click();
    } else {
      await page.locator('a[href^="/product/"]').first().click();
    }

    await page.waitForURL("**/product/**");
    await capture(page, {
      file: "03-detalle-producto.png",
      fullPage: false,
      settleMs: 1200,
      assert: async (p) => {
        await expect(p.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(
          p.getByRole("heading", { name: /no encontrado|Error/i })
        ).toHaveCount(0);
        await expect(
          p.getByRole("link", { name: /Solicitar Cotización|Cotización/i }).or(
            p.getByRole("button", { name: /Solicitar Cotización|Cotización/i })
          ).first()
        ).toBeVisible({ timeout: 15_000 });
      },
    });
  });

  test("04 — marca", async ({ page }) => {
    await page.goto("/marcas/wheaton");
    await capture(page, {
      file: "04-marca.png",
      fullPage: false,
      settleMs: 1200,
      assert: async (p) => {
        await expect(
          p.getByRole("heading", { name: /Productos WHEATON/i })
        ).toBeVisible({ timeout: 30_000 });
      },
    });
  });

  test("05 — cotización", async ({ page }) => {
    await page.goto("/quote", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Solicitar Cotización" })
    ).toBeVisible({ timeout: 30_000 });
    await capture(page, {
      file: "05-cotizacion.png",
      fullPage: true,
      settleMs: 1500,
      assert: async (p) => {
        await expect(
          p.getByRole("heading", { name: "Solicitar Cotización" })
        ).toBeVisible();
      },
    });
  });

  test("06 — soporte", async ({ page }) => {
    await page.goto("/support");
    await capture(page, {
      file: "06-soporte.png",
      fullPage: true,
      assert: async (p) => {
        await expect(
          p.getByRole("heading", { name: "Servicio Técnico" })
        ).toBeVisible();
      },
    });
  });

  test("07 — tickets cliente", async ({ page }) => {
    await page.goto("/tickets");
    await capture(page, {
      file: "07-tickets-cliente.png",
      fullPage: true,
      assert: async (p) => {
        await expect(
          p.getByRole("heading", { name: "Tickets de Servicio" })
        ).toBeVisible();
      },
    });
  });

  test("08 — certificados", async ({ page }) => {
    await page.goto("/certificates");
    await capture(page, {
      file: "08-certificados.png",
      fullPage: true,
      assert: async (p) => {
        await expect(
          p.getByRole("heading", { name: "Búsqueda de Certificados" })
        ).toBeVisible();
      },
    });
  });

  test("09 — contacto", async ({ page }) => {
    await page.goto("/contact");
    await capture(page, {
      file: "09-contacto.png",
      fullPage: true,
      assert: async (p) => {
        await expect(
          p.getByRole("heading", { name: "Contacto", exact: true })
        ).toBeVisible();
      },
    });
  });

  test("10 — empresa", async ({ page }) => {
    await page.goto("/company");
    await capture(page, {
      file: "10-empresa.png",
      fullPage: false,
      settleMs: 1000,
      assert: async (p) => {
        await expect(
          p.getByRole("heading", { name: /Asistiendo a la ciencia/i })
        ).toBeVisible();
      },
    });
  });

  test("11 — mobiliario", async ({ page }) => {
    await page.goto("/furniture");
    await capture(page, {
      file: "11-mobiliario.png",
      fullPage: false,
      settleMs: 1000,
      assert: async (p) => {
        await expect(
          p.getByRole("heading", { name: /Mobiliario para laboratorios/i })
        ).toBeVisible();
      },
    });
  });

  test("12-21 — backoffice autenticado", async ({ page }) => {
    await loginBackoffice(page);

    const boPages: Array<{
      path: string;
      file: string;
      heading: string | RegExp;
      viaSidebar?: string;
    }> = [
      {
        path: "/backoffice",
        file: "12-dashboard.png",
        heading: "Dashboard",
        viaSidebar: "Dashboard",
      },
      {
        path: "/backoffice/users",
        file: "13-usuarios.png",
        heading: "Gestión de Usuarios",
        viaSidebar: "Usuarios",
      },
      {
        path: "/backoffice/products",
        file: "14-productos.png",
        heading: "Gestión de Productos",
        viaSidebar: "Productos",
      },
      {
        path: "/backoffice/quotes",
        file: "15-cotizaciones.png",
        heading: "Gestión de Cotizaciones",
        viaSidebar: "Cotizaciones",
      },
      {
        path: "/backoffice/messages",
        file: "16-mensajes.png",
        heading: "Administrador de Mensajes",
        viaSidebar: "Mensajes",
      },
      {
        path: "/backoffice/brands",
        file: "17-marcas.png",
        heading: "Gestión de Marcas",
        viaSidebar: "Marcas",
      },
      {
        path: "/backoffice/categories",
        file: "18-categorias.png",
        heading: "Gestión de Categorías",
        viaSidebar: "Categorías",
      },
      {
        path: "/backoffice/contacts",
        file: "19-contactos.png",
        heading: "Gestión de Contactos",
        viaSidebar: "Contactos",
      },
      {
        path: "/backoffice/tickets",
        file: "20-tickets-bo.png",
        heading: /Gestión de tickets de servicio/i,
        viaSidebar: "Tickets de servicio",
      },
      {
        path: "/backoffice/libreria",
        file: "21-libreria.png",
        heading: /Gestión de imágenes y archivos de la librería/i,
        viaSidebar: "Librería",
      },
    ];

    for (const item of boPages) {
      if (item.viaSidebar) {
        const link = page.locator("aside a, nav a").filter({
          hasText: item.viaSidebar,
        });
        if ((await link.count()) > 0) {
          await link.first().click();
          await page.waitForURL(`**${item.path}`);
        } else {
          await page.goto(item.path);
        }
      } else {
        await page.goto(item.path);
      }

      await capture(page, {
        file: item.file,
        fullPage: false,
        settleMs: 1200,
        redactPii: true,
        assert: async (p) => {
          await expect(p.getByRole("heading", { name: item.heading })).toBeVisible({
            timeout: 30_000,
          });
          // Sidebar visible (orientación del módulo)
          await expect(
            p.locator("aside, [data-sidebar], nav").filter({ hasText: "Dashboard" }).first()
          ).toBeVisible();
        },
      });
    }
  });

  test("verificar 21 PNG generados", async () => {
    const expected = [
      "01-login.png",
      "02-catalogo.png",
      "03-detalle-producto.png",
      "04-marca.png",
      "05-cotizacion.png",
      "06-soporte.png",
      "07-tickets-cliente.png",
      "08-certificados.png",
      "09-contacto.png",
      "10-empresa.png",
      "11-mobiliario.png",
      "12-dashboard.png",
      "13-usuarios.png",
      "14-productos.png",
      "15-cotizaciones.png",
      "16-mensajes.png",
      "17-marcas.png",
      "18-categorias.png",
      "19-contactos.png",
      "20-tickets-bo.png",
      "21-libreria.png",
    ];

    const missing: string[] = [];
    const tiny: string[] = [];
    for (const name of expected) {
      const full = path.join(SCREENSHOTS_DIR, name);
      if (!fs.existsSync(full)) {
        missing.push(name);
        continue;
      }
      if (fs.statSync(full).size < 5_000) tiny.push(name);
    }

    expect(missing, `Faltan capturas: ${missing.join(", ")}`).toEqual([]);
    expect(tiny, `Capturas demasiado pequeñas: ${tiny.join(", ")}`).toEqual([]);
  });
});
