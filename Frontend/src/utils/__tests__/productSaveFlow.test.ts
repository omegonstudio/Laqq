import { configureStore } from "@reduxjs/toolkit";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { describe, expect, test, beforeAll, afterEach, afterAll, vi } from "vitest";
import productsReducer from "@/store/productSlice";
import specsReducer from "@/store/specsSlice";
import authReducer from "@/store/authSlice";
import categoriesReducer from "@/store/categoriesSlice";
import brandsReducer from "@/store/brandSlice";
import { setStoreReference } from "@/api/client";
import { saveProductFlow } from "@/utils/productSaveFlow";
import { Product, ProductFormState, ProductSpec } from "@/types/types";
import { createAttachment } from "@/utils/fileConvert";
import type { AppDispatch, RootState } from "@/store";

vi.mock("@/utils/fileConvert", async () => {
  const actual = await vi.importActual<typeof import("@/utils/fileConvert")>(
    "@/utils/fileConvert"
  );

  return {
    ...actual,
    createAttachment: vi.fn(async () => ({
      id: "att-mocked",
      file_name: "mocked.png",
      content_type: "image/png",
      size_bytes: 123,
      data: null,
    })),
  };
});

const server = setupServer();

const makeStore = () => {
  const store = configureStore({
    reducer: {
      products: productsReducer,
      specs: specsReducer,
      auth: authReducer,
      categories: categoriesReducer,
      brands: brandsReducer,
    },
  });

  setStoreReference(store as unknown as {
    getState: () => RootState;
    dispatch: AppDispatch;
  });
  return store;
};

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

type JsonRecord = Record<string, unknown>;

const baseProduct = (overrides?: Partial<Product>): Product => ({
  id: "prod-1",
  name: "Producto base",
  brand: "Marca Uno",
  brand_id: "brand-1",
  category: "Categoria Uno",
  category_id: "cat-1",
  description: "Descripcion",
  product_code: "P-100",
  image_attachment: "img-1",
  is_active: true,
  specs: [],
  related: [],
  related_products: [],
  ...overrides,
});

const baseFormState = (overrides?: Partial<ProductFormState>): ProductFormState => ({
  id: "prod-1",
  name: "Producto base",
  brand: "brand-1",
  category: "cat-1",
  description: "Descripcion",
  product_code: "P-100",
  image_attachment: "img-1",
  is_active: true,
  specs: [],
  related: [],
  ...overrides,
});

describe("saveProductFlow", () => {
  test("editar producto sin specs envía solo campos del producto", async () => {
    const productRequests: JsonRecord[] = [];

    server.use(
      http.put("http://127.0.0.1:8000/products/list/:id/", async ({ request, params }) => {
        const body = (await request.json()) as JsonRecord;
        productRequests.push(body);
        return HttpResponse.json({
          ...body,
          id: params.id as string,
          specs: [],
        });
      })
    );

    const store = makeStore();

    await saveProductFlow({
      dispatch: store.dispatch,
      formState: baseFormState(),
      initialData: baseProduct(),
    });

    expect(productRequests).toHaveLength(1);
    const payload = productRequests[0];
    expect(payload).not.toHaveProperty("specs");
    expect(payload).not.toHaveProperty("key");
    expect(payload).not.toHaveProperty("value");
    expect(payload).not.toHaveProperty("unit");
  });

  test("editar con imagen nueva sube attachment antes de actualizar producto", async () => {
    const callOrder: string[] = [];

    const mockedAttachment = vi.mocked(createAttachment);
    mockedAttachment.mockImplementationOnce(async () => {
      callOrder.push("attachment");
      return {
        id: "att-seq",
        file_name: "new.png",
        content_type: "image/png",
        size_bytes: 123,
        data: null,
      };
    });

    server.use(
      http.put("http://127.0.0.1:8000/products/list/:id/", async ({ request, params }) => {
        callOrder.push("product");
        const body = await request.json();
        return HttpResponse.json({
          ...body,
          id: params.id as string,
          specs: [],
        });
      })
    );

    const store = makeStore();
    const file = new File(["data"], "new.png", { type: "image/png" });

    await saveProductFlow({
      dispatch: store.dispatch,
      formState: baseFormState({ image_attachment: file }),
      initialData: baseProduct(),
    });

    expect(callOrder).toEqual(["attachment", "product"]);
  });

  test("modificar solo specs no dispara updateProduct", async () => {
    const productRequests: JsonRecord[] = [];
    const specRequests: Array<{ id: string; body: JsonRecord }> = [];

    server.use(
      http.put("http://127.0.0.1:8000/products/list/:id/", async ({ request }) => {
        productRequests.push((await request.json()) as JsonRecord);
        return HttpResponse.json({});
      }),
      http.put(
        "http://127.0.0.1:8000/products/specifications/:id/",
        async ({ request, params }) => {
          const body = (await request.json()) as JsonRecord;
          specRequests.push({ id: params.id as string, body });
          return HttpResponse.json({
            id: params.id,
            ...body,
          });
        }
      )
    );

    const initialSpecs: ProductSpec[] = [
      {
        id: "spec-1",
        product: "prod-1",
        key: "k1",
        value: "v1",
        unit: "u",
        display_order: 0,
        is_visible: true,
      },
    ];

    const store = makeStore();

    await saveProductFlow({
      dispatch: store.dispatch,
      formState: baseFormState({
        specs: [
          {
            ...initialSpecs[0],
            value: "v2",
          },
        ],
      }),
      initialData: baseProduct({ specs: initialSpecs }),
    });

    expect(productRequests).toHaveLength(0);
    expect(specRequests).toHaveLength(1);
    expect(specRequests[0]).toMatchObject({
      id: "spec-1",
      body: expect.objectContaining({
        value: "v2",
        key: "k1",
      }),
    });
  });
});

