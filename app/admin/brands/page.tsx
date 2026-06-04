"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Constants ──────────────────────────────────────── */
const CATEGORIES = [
  "Tops", "Pantalones", "Vestidos", "Outerwear",
  "Calzado", "Accesorios", "Ropa Interior",
];

const STYLES = [
  "Streetwear", "Casual", "Formal", "Sporty",
  "Vintage", "Minimalist", "Luxury", "Y2K",
];

const SIZES = [
  "XS", "S", "M", "L", "XL", "XXL",
  "28", "30", "32", "34", "36", "38", "40", "42", "44",
];

/* ─── Types ──────────────────────────────────────────── */
interface Brand {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  createdAt: string;
  _count: { garments: number };
}

interface Product {
  id: string;
  name: string;
  brandId: string;
  category: string;
  subcategory: string | null;
  sizes: string[];
  colors: string[];
  price: number;
  description: string | null;
  photos: string[];
  sku: string;
  stock: number;
  createdAt: string;
  brand: { id: string; name: string };
}

interface BrandForm {
  name: string;
  description: string;
  logo: string;
}

interface ProductForm {
  name: string;
  brandId: string;
  category: string;
  subcategory: string;
  style: string;
  sizes: string[];
  colors: string[];
  price: string;
  description: string;
  photos: string;
  photoPreview: string | null;
  sku: string;
  stock: string;
  featured: boolean;
}

const emptyBrandForm: BrandForm = { name: "", description: "", logo: "" };

function emptyProductForm(brandId: string): ProductForm {
  return {
    name: "", brandId, category: "", subcategory: "", style: "",
    sizes: [], colors: [], price: "", description: "",
    photos: "", photoPreview: null, sku: "", stock: "0", featured: false,
  };
}

/* ─── Toast Component ────────────────────────────────── */
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 text-[10px] font-black uppercase tracking-widest animate-fade-in ${
      type === "success" ? "bg-black text-white" : "bg-red-600 text-white"
    }`}>
      {message}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────── */
export default function AdminBrandsPage() {
  // Brands state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandSearch, setBrandSearch] = useState("");

  // Selected brand + products
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);

  // Modals
  const [brandModal, setBrandModal] = useState<{ open: boolean; editing: Brand | null }>({ open: false, editing: null });
  const [brandForm, setBrandForm] = useState<BrandForm>(emptyBrandForm);
  const [productModal, setProductModal] = useState<{ open: boolean; editing: Product | null }>({ open: false, editing: null });
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm(""));

  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [colorInput, setColorInput] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);

  /* ─── Fetch brands ─────────────────────────────────── */
  const fetchBrands = useCallback(async () => {
    setBrandsLoading(true);
    const params = new URLSearchParams();
    if (brandSearch) params.set("search", brandSearch);
    const res = await fetch(`/api/admin/brands?${params}`);
    if (res.ok) {
      const data = await res.json();
      setBrands(data.brands);
    }
    setBrandsLoading(false);
  }, [brandSearch]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  /* ─── Fetch products ───────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    if (!selectedBrand) return;
    setProductsLoading(true);
    const params = new URLSearchParams({
      brandId: selectedBrand.id,
      page: productPage.toString(),
      limit: "20",
    });
    if (productSearch) params.set("search", productSearch);
    const res = await fetch(`/api/admin/products?${params}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setProductTotalPages(data.totalPages);
      setProductTotal(data.total);
    }
    setProductsLoading(false);
  }, [selectedBrand, productPage, productSearch]);

  useEffect(() => {
    if (selectedBrand) fetchProducts();
  }, [selectedBrand, fetchProducts]);

  /* ─── Brand CRUD ───────────────────────────────────── */
  function openCreateBrand() {
    setBrandForm(emptyBrandForm);
    setBrandModal({ open: true, editing: null });
  }

  function openEditBrand(brand: Brand) {
    setBrandForm({ name: brand.name, description: brand.description || "", logo: brand.logo || "" });
    setBrandModal({ open: true, editing: brand });
  }

  async function saveBrand() {
    setSaving(true);
    const payload = {
      name: brandForm.name.trim(),
      description: brandForm.description.trim() || undefined,
      logo: brandForm.logo.trim() || undefined,
    };
    const isEdit = brandModal.editing;
    const res = await fetch(
      isEdit ? `/api/admin/brands/${isEdit.id}` : "/api/admin/brands",
      { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );
    if (res.ok) {
      setBrandModal({ open: false, editing: null });
      fetchBrands();
      setToast({ message: isEdit ? "Marca actualizada" : "Marca creada", type: "success" });
    } else {
      const data = await res.json().catch(() => null);
      setToast({ message: data?.error || "Error al guardar marca", type: "error" });
    }
    setSaving(false);
  }

  async function deleteBrand(brand: Brand) {
    if (!confirm(`Eliminar marca "${brand.name}" y todos sus productos?`)) return;
    setActionLoading(brand.id);
    const res = await fetch(`/api/admin/brands/${brand.id}`, { method: "DELETE" });
    if (res.ok) {
      setBrands((prev) => prev.filter((b) => b.id !== brand.id));
      if (selectedBrand?.id === brand.id) { setSelectedBrand(null); setProducts([]); }
      setToast({ message: "Marca eliminada", type: "success" });
    } else {
      setToast({ message: "Error al eliminar marca", type: "error" });
    }
    setActionLoading(null);
  }

  /* ─── Product CRUD ─────────────────────────────────── */
  function openCreateProduct() {
    if (!selectedBrand) return;
    setProductForm(emptyProductForm(selectedBrand.id));
    setColorInput("");
    setProductModal({ open: true, editing: null });
  }

  function openEditProduct(product: Product) {
    setProductForm({
      name: product.name, brandId: product.brandId,
      category: product.category, subcategory: product.subcategory || "",
      style: "", sizes: product.sizes || [], colors: product.colors || [],
      price: String(product.price), description: product.description || "",
      photos: (product.photos as string[]).join(", "),
      photoPreview: (product.photos as string[])?.[0] || null,
      sku: product.sku, stock: String(product.stock), featured: false,
    });
    setColorInput("");
    setProductModal({ open: true, editing: product });
  }

  async function saveProduct() {
    setSaving(true);
    const photos = productForm.photos.split(",").map((p) => p.trim()).filter(Boolean);
    const payload = {
      name: productForm.name.trim(),
      brandId: productForm.brandId,
      category: productForm.category,
      subcategory: productForm.subcategory.trim() || undefined,
      sizes: productForm.sizes,
      colors: productForm.colors,
      price: parseFloat(productForm.price),
      description: productForm.description.trim() || undefined,
      photos,
      sku: productForm.sku.trim(),
      stock: parseInt(productForm.stock) || 0,
    };
    const isEdit = productModal.editing;
    const res = await fetch(
      isEdit ? `/api/admin/products/${isEdit.id}` : "/api/admin/products",
      { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );
    if (res.ok) {
      setProductModal({ open: false, editing: null });
      fetchProducts();
      fetchBrands();
      setToast({ message: isEdit ? "Producto actualizado" : "Producto creado", type: "success" });
    } else {
      const data = await res.json().catch(() => null);
      setToast({ message: data?.error || "Error al guardar producto", type: "error" });
    }
    setSaving(false);
  }

  async function deleteProduct(product: Product) {
    if (!confirm(`Eliminar producto "${product.name}"?`)) return;
    setActionLoading(product.id);
    const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setProductTotal((t) => t - 1);
      fetchBrands();
      setToast({ message: "Producto eliminado", type: "success" });
    } else {
      setToast({ message: "Error al eliminar producto", type: "error" });
    }
    setActionLoading(null);
  }

  /* ─── Helpers ──────────────────────────────────────── */
  function toggleSize(size: string) {
    setProductForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  }

  function addColor() {
    const c = colorInput.trim();
    if (c && !productForm.colors.includes(c)) {
      setProductForm((prev) => ({ ...prev, colors: [...prev.colors, c] }));
      setColorInput("");
    }
  }

  function removeColor(color: string) {
    setProductForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c !== color),
    }));
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setProductForm((prev) => ({
        ...prev,
        photos: prev.photos ? prev.photos + ", " + result : result,
        photoPreview: result,
      }));
    };
    reader.readAsDataURL(file);
  }

  /* ─── Skeleton Components ──────────────────────────── */
  function BrandSkeleton() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-100 p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded" />
              <div className="flex-1">
                <div className="h-3 bg-gray-100 rounded w-24 mb-1" />
                <div className="h-2 bg-gray-50 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tighter text-black">
          Marcas y Productos
        </h1>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
          Gestiona el catalogo de la plataforma
        </p>
      </div>

      {/* ═══════════════════════════════════════════════
          BRANDS SECTION
          ═══════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black">
            MARCAS ({brands.length})
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="BUSCAR..."
              className="text-[10px] font-bold uppercase tracking-widest border border-gray-100 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-700 w-48 placeholder:text-gray-300"
            />
            <button
              onClick={openCreateBrand}
              className="text-[10px] font-black uppercase tracking-widest bg-purple-700 text-white px-4 py-2 hover:bg-purple-800 transition-colors"
            >
              + Nueva Marca
            </button>
          </div>
        </div>

        {brandsLoading ? (
          <BrandSkeleton />
        ) : brands.length === 0 ? (
          <div className="border border-gray-100 py-16 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
              No hay marcas. Crea la primera.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <div
                key={brand.id}
                onClick={() => {
                  setSelectedBrand(brand);
                  setProductPage(1);
                  setProductSearch("");
                }}
                className={`bg-white border p-5 cursor-pointer transition-all hover:border-purple-200 ${
                  selectedBrand?.id === brand.id
                    ? "border-purple-700 ring-1 ring-purple-100"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-50 border border-gray-100 flex items-center justify-center text-sm font-black text-gray-200 flex-shrink-0 overflow-hidden">
                      {brand.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                      ) : (
                        brand.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">{brand.name}</p>
                      <p className="text-[9px] text-gray-400">
                        {brand._count.garments} producto{brand._count.garments !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditBrand(brand); }}
                      className="text-[9px] font-black uppercase tracking-wider px-2 py-1 text-gray-400 hover:text-purple-700 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteBrand(brand); }}
                      disabled={actionLoading === brand.id}
                      className="text-[9px] font-black uppercase tracking-wider px-2 py-1 text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                {brand.description && (
                  <p className="text-[9px] text-gray-400 mt-2 line-clamp-2">
                    {brand.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          PRODUCTS SECTION
          ═══════════════════════════════════════════════ */}
      {selectedBrand && (
        <div>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black">
                {selectedBrand.name} — PRODUCTOS ({productTotal})
              </p>
              <button
                onClick={() => { setSelectedBrand(null); setProducts([]); }}
                className="text-[9px] text-gray-300 hover:text-gray-600 uppercase tracking-wider"
              >
                Limpiar
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }}
                placeholder="BUSCAR..."
                className="text-[10px] font-bold uppercase tracking-widest border border-gray-100 px-4 py-2 outline-none focus:ring-2 focus:ring-purple-700 w-48 placeholder:text-gray-300"
              />
              <button
                onClick={openCreateProduct}
                className="text-[10px] font-black uppercase tracking-widest bg-purple-700 text-white px-4 py-2 hover:bg-purple-800 transition-colors"
              >
                + Nuevo Producto
              </button>
            </div>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-100 animate-pulse">
                  <div className="aspect-square bg-gray-50" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-24" />
                    <div className="h-2 bg-gray-50 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="border border-gray-100 py-16 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                No hay productos. Agrega el primero.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="border border-gray-100 overflow-hidden group">
                    {/* Product Image */}
                    <div className="relative aspect-square bg-gray-50">
                      {(product.photos as string[])?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(product.photos as string[])[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Category badge */}
                      <span className="absolute top-2 left-2 bg-black/70 text-white text-[8px] font-black uppercase tracking-wider px-2 py-1">
                        {product.category}
                      </span>
                      {/* Stock badge */}
                      {product.stock === 0 && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-1">
                          SIN STOCK
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-black truncate">
                        {product.name}
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5">
                        {product.brand.name} &middot; SKU: {product.sku}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-sm font-black text-purple-700">
                          ${Number(product.price).toFixed(2)}
                        </p>
                        <span className={`text-[9px] font-black px-2 py-0.5 ${
                          product.stock > 10
                            ? "bg-green-50 text-green-700"
                            : product.stock > 0
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-red-50 text-red-700"
                        }`}>
                          Stock: {product.stock}
                        </span>
                      </div>

                      {/* Sizes */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(product.sizes as string[]).map((s) => (
                          <span key={s} className="text-[8px] bg-gray-50 text-gray-400 px-1.5 py-0.5 font-bold">
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openEditProduct(product)}
                          className="flex-1 text-[9px] font-black uppercase tracking-widest py-2 border border-gray-100 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteProduct(product)}
                          disabled={actionLoading === product.id}
                          className="flex-1 text-[9px] font-black uppercase tracking-widest py-2 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {productTotalPages > 1 && (
                <div className="flex items-center justify-between py-4 mt-4 border-t border-gray-100">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                    Pagina {productPage} de {productTotalPages} ({productTotal} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                      disabled={productPage === 1}
                      className="text-[9px] font-black uppercase tracking-widest px-4 py-2 border border-gray-100 disabled:opacity-30 hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setProductPage((p) => Math.min(productTotalPages, p + 1))}
                      disabled={productPage === productTotalPages}
                      className="text-[9px] font-black uppercase tracking-widest px-4 py-2 border border-gray-100 disabled:opacity-30 hover:bg-gray-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          BRAND MODAL
          ═══════════════════════════════════════════════ */}
      {brandModal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-8">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-black mb-6">
              {brandModal.editing ? "EDITAR MARCA" : "NUEVA MARCA"}
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Nombre *</label>
                <input
                  type="text"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full text-xs border border-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-700"
                  placeholder="Nombre de la marca"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Descripcion</label>
                <textarea
                  value={brandForm.description}
                  onChange={(e) => setBrandForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full text-xs border border-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-700 resize-none"
                  rows={3}
                  placeholder="Descripcion de la marca"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Logo URL</label>
                <input
                  type="url"
                  value={brandForm.logo}
                  onChange={(e) => setBrandForm((f) => ({ ...f, logo: e.target.value }))}
                  className="w-full text-xs border border-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-700"
                  placeholder="https://..."
                />
                {brandForm.logo && (
                  <div className="mt-2 w-16 h-16 bg-gray-50 border border-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={brandForm.logo} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setBrandModal({ open: false, editing: null })}
                className="flex-1 text-[10px] font-black uppercase tracking-widest py-3 border border-gray-100 text-gray-400 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveBrand}
                disabled={saving || !brandForm.name.trim()}
                className="flex-1 text-[10px] font-black uppercase tracking-widest py-3 bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-40 transition-colors"
              >
                {saving ? "Guardando..." : brandModal.editing ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          PRODUCT MODAL (COMPLETE FORM)
          ═══════════════════════════════════════════════ */}
      {productModal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 z-10">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-black">
                {productModal.editing ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO"}
              </p>
            </div>

            <div className="p-8 space-y-6">
              {/* 1. Photo */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                  FOTO DEL PRODUCTO
                </label>
                <div className="flex gap-4 items-start">
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-32 aspect-square bg-gray-50 border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors flex items-center justify-center overflow-hidden flex-shrink-0"
                  >
                    {productForm.photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={productForm.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={productForm.photos}
                      onChange={(e) => setProductForm((f) => ({ ...f, photos: e.target.value }))}
                      className="w-full text-xs border border-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-700"
                      placeholder="URLs de fotos (separadas por coma)"
                    />
                    <p className="text-[8px] text-gray-300 mt-1 uppercase tracking-wider">
                      Sube una foto o ingresa URLs separadas por coma
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Basic Info */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                  INFORMACION BASICA
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full text-xs border border-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-700"
                    placeholder="Nombre del producto *"
                  />
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full text-xs border border-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-700 resize-none"
                    rows={2}
                    placeholder="Descripcion"
                  />
                  <select
                    value={productForm.brandId}
                    onChange={(e) => setProductForm((f) => ({ ...f, brandId: e.target.value }))}
                    className="w-full text-xs border border-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-700 bg-white"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Price & Stock */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                  PRECIO Y STOCK
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                      className="w-full text-xs border border-gray-100 pl-7 pr-4 py-3 outline-none focus:ring-2 focus:ring-purple-700"
                      placeholder="Precio *"
                    />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm((f) => ({ ...f, stock: e.target.value }))}
                    className="w-full text-xs border border-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-700"
                    placeholder="Stock"
                  />
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm((f) => ({ ...f, sku: e.target.value }))}
                    className="w-full text-xs border border-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-700"
                    placeholder="SKU *"
                  />
                </div>
              </div>

              {/* 4. Category */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                  CATEGORIA
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProductForm((f) => ({ ...f, category: cat }))}
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-2 border transition-colors ${
                        productForm.category === cat
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Style */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                  ESTILO
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setProductForm((f) => ({ ...f, style: s, subcategory: s }))}
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-2 border transition-colors ${
                        productForm.style === s
                          ? "bg-purple-700 text-white border-purple-700"
                          : "bg-white text-gray-400 border-gray-100 hover:border-purple-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Sizes */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                  TALLAS DISPONIBLES
                </label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`text-[9px] font-black uppercase tracking-widest w-10 h-10 border transition-colors ${
                        productForm.sizes.includes(size)
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Colors */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                  COLORES DISPONIBLES
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
                    className="flex-1 text-xs border border-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-700"
                    placeholder="Escribe un color y presiona Enter"
                  />
                  <button
                    type="button"
                    onClick={addColor}
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-3 bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Agregar
                  </button>
                </div>
                {productForm.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {productForm.colors.map((color) => (
                      <span
                        key={color}
                        className="text-[9px] font-black uppercase tracking-wider bg-gray-50 text-gray-600 px-3 py-1.5 flex items-center gap-2 border border-gray-100"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: color.toLowerCase() }}
                        />
                        {color}
                        <button
                          type="button"
                          onClick={() => removeColor(color)}
                          className="text-gray-300 hover:text-red-500 ml-1"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 8. Featured */}
              <div className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => setProductForm((f) => ({ ...f, featured: !f.featured }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    productForm.featured ? "bg-purple-700" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      productForm.featured ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                  Producto destacado
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-5">
              <div className="flex gap-3">
                <button
                  onClick={() => setProductModal({ open: false, editing: null })}
                  className="flex-1 text-[10px] font-black uppercase tracking-widest py-4 border border-gray-100 text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveProduct}
                  disabled={
                    saving ||
                    !productForm.name.trim() ||
                    !productForm.category ||
                    !productForm.price ||
                    !productForm.sku.trim() ||
                    productForm.sizes.length === 0 ||
                    productForm.colors.length === 0 ||
                    !productForm.photos.trim()
                  }
                  className="flex-[2] text-[10px] font-black uppercase tracking-widest py-4 bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-40 transition-colors"
                >
                  {saving ? "Guardando..." : productModal.editing ? "ACTUALIZAR PRODUCTO" : "CREAR PRODUCTO"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
