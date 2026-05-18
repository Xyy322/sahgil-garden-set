import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Plus, Trash2, Edit3, X } from "lucide-react";

import { db } from "../../utils/firebase/config";
import type { Product } from "../../types/product";
import { uploadProductImage } from "../../utils/firebase/uploadProductImage";
import { useAuth } from "../context/AuthContext";

type ProductFormData = Omit<Product, "id">;

function formatMoney(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `₱${value.toFixed(2)}`;
}

function getEmptyProduct(): ProductFormData {
  return {
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    category: "",
    customizable: false,
    status: "available",
  };
}

function normalizeProduct(id: string, data: any): Product {
  const status =
    data.status === "available" ||
    data.status === "unavailable" ||
    data.status === "out-of-stock"
      ? data.status
      : "available";

  return {
    id,
    name: typeof data.name === "string" ? data.name : "Untitled Product",
    description: typeof data.description === "string" ? data.description : "",
    price: typeof data.price === "number" ? data.price : Number(data.price) || 0,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    category: typeof data.category === "string" ? data.category : "",
    customizable: data.customizable === true,
    status,
  };
}

export function AdminProducts() {
  const { user, role, loading: authLoading } = useAuth();

  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newProduct, setNewProduct] = useState<ProductFormData>(getEmptyProduct());

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setProducts([]);
      setProductsError("You must be logged in as admin to manage products.");
      setLoadingProducts(false);
      return;
    }

    if (role !== "admin") {
      setProducts([]);
      setProductsError("Access denied. Only administrators can manage products.");
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);
    setProductsError("");

    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        try {
          const mapped = snapshot.docs
            .map((document) => normalizeProduct(document.id, document.data()))
            .sort((a, b) => a.name.localeCompare(b.name));

          setProducts(mapped);
          setProductsError("");
        } catch (error) {
          console.error("Product parsing error:", error);
          setProductsError("Some product records contain invalid data.");
        } finally {
          setLoadingProducts(false);
        }
      },
      (error) => {
        console.error("Products listener error:", error);
        setProducts([]);
        setProductsError(error.message || "Failed to load products.");
        setLoadingProducts(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user, role]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(q) ||
        (product.category || "").toLowerCase().includes(q) ||
        (product.description || "").toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  const resetForm = () => {
    setNewProduct(getEmptyProduct());
    setImageFile(null);
    setEditingProduct(null);
    setFormError("");
    setShowProductForm(false);
  };

  const openAddForm = () => {
    setNewProduct(getEmptyProduct());
    setImageFile(null);
    setEditingProduct(null);
    setFormError("");
    setShowProductForm(true);
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name || "",
      description: product.description || "",
      price: Number(product.price) || 0,
      imageUrl: product.imageUrl || "",
      category: product.category || "",
      customizable: product.customizable === true,
      status: product.status || "available",
    });
    setImageFile(null);
    setFormError("");
    setShowProductForm(true);
  };

  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (role !== "admin") {
      setFormError("Only administrators can save products.");
      return;
    }

    const cleanName = newProduct.name.trim();
    const cleanDescription = newProduct.description.trim();
    const cleanCategory = (newProduct.category || "").trim();
    const cleanPrice = Number(newProduct.price);

    if (!cleanName) {
      setFormError("Please enter the product name.");
      return;
    }

    if (!cleanDescription) {
      setFormError("Please enter the product description.");
      return;
    }

    if (!cleanCategory) {
      setFormError("Please enter the product category.");
      return;
    }

    if (!Number.isFinite(cleanPrice) || cleanPrice <= 0) {
      setFormError("Please enter a valid price greater than 0.");
      return;
    }

    if (!editingProduct && !imageFile) {
  setFormError("Please upload a product image.");
  return;
}

    setSubmitting(true);
    setFormError("");

    try {
      let imageUrl = newProduct.imageUrl || "";

      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const productPayload = {
        name: cleanName,
        description: cleanDescription,
        price: cleanPrice,
        imageUrl,
        category: cleanCategory,
        customizable: newProduct.customizable === true,
        status: newProduct.status || "available",
        updatedAt: serverTimestamp(),
      };

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), productPayload);
      } else {
        await addDoc(collection(db, "products"), {
          ...productPayload,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to save product. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (role !== "admin") {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingProductId(id);

    try {
      await deleteDoc(doc(db, "products", id));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete product. Please try again."
      );
    } finally {
      setDeletingProductId(null);
    }
  };

  if (authLoading || loadingProducts) {
    return (
      <div className="flex items-center justify-center py-12">
        Loading products...
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {productsError}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-3xl p-8 shadow-lg border border-stone-100 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b pb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-emerald-700 tracking-tight mb-1">
              {editingProduct
                ? `Edit Product: ${editingProduct.name}`
                : "Products Management"}
            </h2>
            <p className="text-stone-500 text-base">
              Manage products, update details, and keep the customer catalog updated.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <button
              type="button"
              onClick={openAddForm}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>
        </header>

        {showProductForm && (
          <form
            onSubmit={saveProduct}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-stone-50 rounded-2xl border border-stone-200 mb-8"
          >
            <div className="flex flex-col gap-2">
              <label className="font-medium text-stone-700">Product Name</label>
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-stone-700">Price</label>
              <input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    price: Number(e.target.value) || 0,
                  })
                }
                className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                min={1}
                step="0.01"
                required
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-medium text-stone-700">Description</label>
              <textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    description: e.target.value,
                  })
                }
                className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                rows={3}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-stone-700">Category</label>
              <input
                type="text"
                placeholder="Category"
                value={newProduct.category || ""}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
                className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-stone-700">Status</label>
              <select
                value={newProduct.status}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    status: e.target.value as Product["status"],
                  })
                }
                className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <div className="flex items-center gap-3 md:col-span-2">
              <input
                id="customizable"
                type="checkbox"
                checked={newProduct.customizable === true}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    customizable: e.target.checked,
                  })
                }
                className="h-4 w-4"
              />
              <label htmlFor="customizable" className="font-medium text-stone-700">
                Customizable product
              </label>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-medium text-stone-700">Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="border p-2 rounded-lg bg-white"
              />

              {imageFile && (
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="mt-2 h-32 w-32 object-contain rounded-lg border bg-white"
                />
              )}

              {!imageFile && newProduct.imageUrl && (
                <img
                  src={newProduct.imageUrl}
                  alt="Current product"
                  className="mt-2 h-32 w-32 object-contain rounded-lg border bg-white"
                />
              )}
            </div>

            {formError && (
              <div className="md:col-span-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {submitting
                  ? "Saving..."
                  : editingProduct
                  ? "Update Product"
                  : "Add Product"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="flex-1 bg-stone-200 py-3 rounded-xl font-semibold hover:bg-stone-300 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-stone-100 text-stone-700">
              <tr>
                <th className="py-3 px-4 font-semibold">Image</th>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Price</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-stone-400"
                  >
                    No products found.
                  </td>
                </tr>
              )}

              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b last:border-b-0 hover:bg-stone-50 transition-colors"
                >
                  <td className="py-2 px-4">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-16 w-16 object-contain rounded border bg-white"
                      />
                    ) : (
                      <span className="text-stone-300">No image</span>
                    )}
                  </td>

                  <td className="py-2 px-4 font-medium text-stone-800">
                    {product.name}
                  </td>

                  <td className="py-2 px-4">{formatMoney(product.price)}</td>

                  <td className="py-2 px-4">
                    {product.category || "Uncategorized"}
                  </td>

                  <td className="py-2 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.status === "available"
                          ? "bg-emerald-100 text-emerald-700"
                          : product.status === "out-of-stock"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {(product.status || "available")
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </td>

                  <td className="py-2 px-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editProduct(product)}
                        className="p-2 rounded hover:bg-emerald-50"
                        title="Edit"
                      >
                        <Edit3 className="w-5 h-5 text-emerald-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        disabled={deletingProductId === product.id}
                        className="p-2 rounded hover:bg-red-50 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingProductId === product.id ? (
                          <X className="w-5 h-5 text-stone-400" />
                        ) : (
                          <Trash2 className="w-5 h-5 text-red-500" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}