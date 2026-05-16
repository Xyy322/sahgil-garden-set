import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { getAuth, type User } from "firebase/auth";
import { db } from "../../utils/firebase/config";
import type { Product } from "../../types/product";
import { Plus, Trash2, Edit3 } from "lucide-react";

// ✅ ADD THIS IMPORT
import { uploadProductImage } from "../../utils/firebase/uploadProductImage";

function formatMoney(value?: number): string {
  if (typeof value !== "number") return "N/A";
  return `₱${value.toFixed(2)}`;
}

export function AdminProducts() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [role, setRole] = useState<"admin" | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ✅ NEW: image file state
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    category: "",
    customizable: false,
    status: "available",
  });

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged(async (user: User | null) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setRole(userDoc.data().role as "admin");
      }
    });

    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (role !== "admin") return;

    const q = collection(db, "products");
    const unsub = onSnapshot(q, (snap) => {
      const mapped = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Product[];

      setProducts(mapped);
      setLoadingProducts(false);
    });

    return () => unsub();
  }, [role]);

  // 🔥 UPDATED ADD PRODUCT (WITH IMAGE UPLOAD)
  const addProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newProduct.name || newProduct.price <= 0) {
      alert("Please fill in all fields correctly");
      return;
    }

    try {
      let imageUrl = newProduct.imageUrl;

      // ✅ upload to firebase storage
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), {
          ...newProduct,
          imageUrl,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "products"), {
          ...newProduct,
          imageUrl,
          createdAt: serverTimestamp(),
        });
      }

      // reset form
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        imageUrl: "",
        category: "",
        customizable: false,
        status: "available",
      });

      setImageFile(null);
      setEditingProduct(null);
      setShowProductForm(false);
    } catch (err) {
      console.error("Error adding/updating product", err);
    }
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product as any);
    setShowProductForm(true);
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    await deleteDoc(doc(db, "products", id));
  };

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center py-12">
        Loading products...
      </div>
    );
  }

  const filteredProducts = products.filter((product) => {
    const q = search.toLowerCase();
    return (
      product.name.toLowerCase().includes(q) ||
      (product.category && product.category.toLowerCase().includes(q)) ||
      (product.description &&
        product.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {role === "admin" && (
        <section className="bg-white rounded-3xl p-8 shadow-lg border border-stone-100 space-y-8">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b pb-4">
            <div>
              <h2 className="text-3xl font-extrabold text-emerald-700 tracking-tight mb-1">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : "Products Management"}
              </h2>
              <p className="text-stone-500 text-base">Manage your shop's products, update details, and keep your catalog fresh.</p>
            </div>
            <button
              onClick={() => {
                setShowProductForm(true);
                setEditingProduct(null);
                setNewProduct({
                  name: "",
                  description: "",
                  price: 0,
                  imageUrl: "",
                  category: "",
                  customizable: false,
                  status: "available",
                });
              }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </header>

          {showProductForm && (
            <form
              onSubmit={addProduct}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-stone-50 rounded-2xl border border-stone-200 mb-8"
            >
              <div className="flex flex-col gap-2">
                <label className="font-medium text-stone-700">Product Name</label>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
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
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  min={0}
                  required
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-medium text-stone-700">Description</label>
                <textarea
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
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
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-medium text-stone-700">Status</label>
                <select
                  value={newProduct.status}
                  onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value as any })}
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-medium text-stone-700">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="border p-2 rounded-lg"
                />
                {imageFile && (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="mt-2 h-32 object-contain rounded-lg border"
                  />
                )}
                {!imageFile && newProduct.imageUrl && (
                  <img
                    src={newProduct.imageUrl}
                    alt="Current"
                    className="mt-2 h-32 object-contain rounded-lg border"
                  />
                )}
              </div>
              <div className="md:col-span-2 flex gap-4 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-emerald-700 transition-colors"
                >
                  {editingProduct ? "Update" : "Add Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="flex-1 bg-stone-200 py-3 rounded-xl font-semibold hover:bg-stone-300 transition-colors"
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
                    <td colSpan={6} className="text-center py-8 text-stone-400">No products found.</td>
                  </tr>
                )}
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-b-0 hover:bg-stone-50 transition-colors">
                    <td className="py-2 px-4">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-16 w-16 object-contain rounded border" />
                      ) : (
                        <span className="text-stone-300">No image</span>
                      )}
                    </td>
                    <td className="py-2 px-4 font-medium text-stone-800">{product.name}</td>
                    <td className="py-2 px-4">{formatMoney(product.price)}</td>
                    <td className="py-2 px-4">{product.category}</td>
                    <td className="py-2 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.status === 'available' ? 'bg-emerald-100 text-emerald-700' : product.status === 'out-of-stock' ? 'bg-yellow-100 text-yellow-700' : 'bg-stone-200 text-stone-500'}`}>
                        {product.status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => editProduct(product)} className="p-2 rounded hover:bg-emerald-50" title="Edit">
                          <Edit3 className="w-5 h-5 text-emerald-600" />
                        </button>
                        <button onClick={() => deleteProduct(product.id)} className="p-2 rounded hover:bg-red-50" title="Delete">
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}