import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  AlertCircle,
  Edit3,
  Eye,
  ImageIcon,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "../../utils/firebase/config";
import type { Product } from "../../types/product";
import { uploadProductImage } from "../../utils/firebase/uploadProductImage";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

type ProductCatalogStatus = "available" | "unavailable";
type StatusFilter = "all" | ProductCatalogStatus;

type ProductFormData = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  status: ProductCatalogStatus;
};

const PRODUCTS_PER_PAGE = 5;

function formatMoney(value?: number): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₱0.00";
  }

  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatStatus(status?: string): string {
  return status === "available" ? "Shown in Catalog" : "Hidden from Catalog";
}

function statusBadge(status?: string): string {
  if (status === "available") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-600";
}

function getEmptyProduct(): ProductFormData {
  return {
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    category: "",
    status: "available",
  };
}

function normalizeProduct(id: string, data: any): Product {
  const status: Product["status"] =
    data.status === "available" ? "available" : "unavailable";

  return {
    id,
    name:
      typeof data.name === "string" && data.name.trim()
        ? data.name
        : "Untitled Product",
    description: typeof data.description === "string" ? data.description : "",
    price: typeof data.price === "number" ? data.price : Number(data.price) || 0,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    category: typeof data.category === "string" ? data.category : "",
    status,
  } as Product;
}

export function AdminProducts() {
  const { user, role, loading: authLoading } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newProduct, setNewProduct] =
    useState<ProductFormData>(getEmptyProduct());

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
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const productStatus =
        product.status === "available" ? "available" : "unavailable";

      const matchesStatus =
        statusFilter === "all" || productStatus === statusFilter;

      const searchableText = [
        product.name,
        product.category,
        product.description,
        productStatus,
        formatStatus(productStatus),
        product.id,
        formatMoney(product.price),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [products, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  );

  const pageStartIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageEndIndex = Math.min(
    pageStartIndex + PRODUCTS_PER_PAGE,
    filteredProducts.length
  );

  const paginatedProducts = filteredProducts.slice(pageStartIndex, pageEndIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const stats = useMemo(() => {
    const categories = new Set(
      products
        .map((product) => product.category?.trim())
        .filter((category): category is string => Boolean(category))
    );

    return {
      total: products.length,
      shown: products.filter((product) => product.status === "available").length,
      hidden: products.filter((product) => product.status !== "available")
        .length,
      categories: categories.size,
    };
  }, [products]);

  const resetForm = () => {
    setNewProduct(getEmptyProduct());
    setImageFile(null);
    setEditingProduct(null);
    setFormError("");
    setFormOpen(false);
  };

  const openAddForm = () => {
    setNewProduct(getEmptyProduct());
    setImageFile(null);
    setEditingProduct(null);
    setFormError("");
    setFormOpen(true);
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);

    setNewProduct({
      name: product.name || "",
      description: product.description || "",
      price: Number(product.price) || 0,
      imageUrl: product.imageUrl || "",
      category: product.category || "",
      status: product.status === "available" ? "available" : "unavailable",
    });

    setImageFile(null);
    setFormError("");
    setFormOpen(true);
  };

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (role !== "admin") {
      setFormError("Only administrators can save products.");
      return;
    }

    const cleanName = newProduct.name.trim();
    const cleanDescription = newProduct.description.trim();
    const cleanCategory = newProduct.category.trim();
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
        status: newProduct.status,
        updatedAt: serverTimestamp(),
      };

      if (editingProduct) {
  await updateDoc(doc(db, "products", editingProduct.id), productPayload);

  toast.success("Product updated", {
    description: `${cleanName} has been updated successfully.`,
  });
} else {
  await addDoc(collection(db, "products"), {
    ...productPayload,
    createdAt: serverTimestamp(),
  });

  toast.success("Product added", {
    description: `${cleanName} has been added to the catalog.`,
  });
}

resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      const message =
  error instanceof Error
    ? error.message
    : "Failed to save product. Please try again.";

setFormError(message);

toast.error("Failed to save product", {
  description: message,
});
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

toast.success("Product deleted", {
  description: "The product has been removed successfully.",
});
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(
        toast.error("Failed to delete product", {
  description:
    error instanceof Error
      ? error.message
      : "Failed to delete product. Please try again.",
})
      );
    } finally {
      setDeletingProductId(null);
    }
  };

  if (authLoading || loadingProducts) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
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
    <div className="page-fade-in space-y-8">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Product Management
            </p>

            <h1 className="mt-1 text-2xl font-bold text-card-foreground md:text-3xl">
              Product Catalog
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage made-to-order garden furniture products shown in the
              customer catalog.
            </p>
          </div>

          <Button onClick={openAddForm} className="w-full gap-2 lg:w-auto">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Products"
          value={stats.total}
          icon={<Package className="h-5 w-5" />}
        />
        <SummaryCard
          label="Shown in Catalog"
          value={stats.shown}
          icon={<Eye className="h-5 w-5" />}
          highlight
        />
        <SummaryCard
          label="Hidden from Catalog"
          value={stats.hidden}
          icon={<Tag className="h-5 w-5" />}
        />
        <SummaryCard
          label="Categories"
          value={stats.categories}
          icon={<Edit3 className="h-5 w-5" />}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">
              Products
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {filteredProducts.length === 0
                ? "0"
                : `${pageStartIndex + 1}-${pageEndIndex}`}{" "}
              of {filteredProducts.length} filtered product
              {filteredProducts.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search product, category, description..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              aria-label="Filter products by catalog visibility"
            >
              <option value="all">All Products</option>
              <option value="available">Shown in Catalog</option>
              <option value="unavailable">Hidden from Catalog</option>
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-border bg-background py-10 text-center text-sm text-muted-foreground">
            No products found.
          </div>
        ) : (
          <div className="max-h-[720px] space-y-3 overflow-y-auto pr-2">
            {paginatedProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl border border-border bg-background p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {product.name}
                        </p>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
                            product.status
                          )}`}
                        >
                          {formatStatus(product.status)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.category || "Uncategorized"} •{" "}
                        {formatMoney(product.price)}
                      </p>

                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {product.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editProduct(product)}
                    >
                      <Edit3 className="mr-1 h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => deleteProduct(product.id)}
                      disabled={deletingProductId === product.id}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      {deletingProductId === product.id ? "Deleting" : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProducts.length > PRODUCTS_PER_PAGE && (
          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          else setFormOpen(true);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
            <DialogDescription>
              Fill in the made-to-order product details shown in the customer
              catalog.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveProduct} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Product Name">
                <input
                  type="text"
                  placeholder="Product name"
                  value={newProduct.name}
                  onChange={(event) =>
                    setNewProduct({ ...newProduct, name: event.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </FormField>

              <FormField label="Price">
                <input
                  type="number"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(event) =>
                    setNewProduct({
                      ...newProduct,
                      price: Number(event.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  min={1}
                  step="0.01"
                  required
                />
              </FormField>

              <FormField label="Category">
                <input
                  type="text"
                  placeholder="Category"
                  value={newProduct.category || ""}
                  onChange={(event) =>
                    setNewProduct({
                      ...newProduct,
                      category: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </FormField>

              <FormField label="Catalog Visibility">
                <select
                  value={newProduct.status}
                  onChange={(event) =>
                    setNewProduct({
                      ...newProduct,
                      status: event.target.value as ProductCatalogStatus,
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="available">Shown in Catalog</option>
                  <option value="unavailable">Hidden from Catalog</option>
                </select>
              </FormField>
            </div>

            <FormField label="Description">
              <textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={(event) =>
                  setNewProduct({
                    ...newProduct,
                    description: event.target.value,
                  })
                }
                className="min-h-[110px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </FormField>

            <FormField label="Product Image">
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setImageFile(event.target.files?.[0] || null)
                }
                className="w-full rounded-xl border border-border bg-background p-3 text-sm"
              />

              <div className="mt-3 flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
                {imageFile ? (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : newProduct.imageUrl ? (
                  <img
                    src={newProduct.imageUrl}
                    alt="Current product"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            </FormField>

            {formError && (
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : editingProduct
                  ? "Update Product"
                  : "Add Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              Complete product information shown in the made-to-order catalog.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr]">
                <div className="flex h-56 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <h3 className="text-2xl font-bold text-foreground">
                      {selectedProduct.name}
                    </h3>
                  </div>

                  <span
                    className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
                      selectedProduct.status
                    )}`}
                  >
                    {formatStatus(selectedProduct.status)}
                  </span>

                  <DetailRow
                    label="Price"
                    value={formatMoney(selectedProduct.price)}
                  />

                  <DetailRow
                    label="Category"
                    value={selectedProduct.category || "Uncategorized"}
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Description
                </p>
                <p className="whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                  {selectedProduct.description || "No description provided."}
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProduct(null)}
                >
                  Close
                </Button>

                <Button
                  onClick={() => {
                    setSelectedProduct(null);
                    editProduct(selectedProduct);
                  }}
                >
                  <Edit3 className="mr-1 h-4 w-4" />
                  Edit Product
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border bg-card text-foreground"
      }`}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-primary">
        {icon}
      </div>

      <p className="text-xs font-medium uppercase tracking-wide opacity-70">
        {label}
      </p>

      <h3 className="mt-1 text-2xl font-bold">{value}</h3>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}