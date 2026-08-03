import { Edit3, Trash2, Package, Image as ImageIcon } from "lucide-react";
import type { ProductRow, CategoryRow } from "@/types/database";

export type ProductWithPrimaryImage = ProductRow & { primary_image_url?: string | null };

interface ProductTableProps {
  products: ProductWithPrimaryImage[];
  categories: CategoryRow[];
  onEdit: (product: ProductRow) => void;
  onDelete: (productId: string) => void;
}

export function ProductTable({ products, categories, onEdit, onDelete }: ProductTableProps) {
  const getCategoryName = (catId: string | null) => {
    if (!catId) return "Uncategorized";
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : "Uncategorized";
  };

  const getStatusBadge = (product: ProductRow) => {
    if (product.status === "ACTIVE") {
      if (product.stock_quantity <= 0 && !product.allow_backorder) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            Out of Stock
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          Active
        </span>
      );
    }
    if (product.status === "DRAFT") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          Draft
        </span>
      );
    }
    if (product.status === "HIDDEN") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          Hidden
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-500">
        Archived
      </span>
    );
  };

  if (products.length === 0) {
    return (
      <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/50">
        <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">No products found</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Get started by adding your first product to the Aura & Soul catalog with photos, pricing, and variants.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900 shadow-xl">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
          <tr>
            <th className="p-3.5">Product</th>
            <th className="p-3.5">Category</th>
            <th className="p-3.5">Status</th>
            <th className="p-3.5">Inventory</th>
            <th className="p-3.5">Price</th>
            <th className="p-3.5">Tags</th>
            <th className="p-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-200">
          {products.map((p) => {
            const isLowStock = p.track_inventory && p.stock_quantity <= p.low_stock_threshold;
            const isOutOfStock = p.track_inventory && p.stock_quantity <= 0;

            return (
              <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center text-slate-600">
                      {p.primary_image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.primary_image_url}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        {p.title}
                        {p.has_variants && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded">
                            Variants
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        /products/{p.slug} {p.sku && `• SKU: ${p.sku}`}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="p-3.5 font-medium text-slate-300">
                  {getCategoryName(p.category_id)}
                </td>

                <td className="p-3.5">{getStatusBadge(p)}</td>

                <td className="p-3.5">
                  <div className="font-mono font-medium">
                    <span
                      className={
                        isOutOfStock
                          ? "text-rose-400 font-bold"
                          : isLowStock
                          ? "text-amber-400"
                          : "text-slate-200"
                      }
                    >
                      {p.stock_quantity} units
                    </span>
                    {isLowStock && !isOutOfStock && (
                      <span className="ml-1 text-[10px] text-amber-400">(Low)</span>
                    )}
                  </div>
                </td>

                <td className="p-3.5 font-mono">
                  <div className="font-semibold text-slate-100">${p.price.toFixed(2)}</div>
                  {p.compare_at_price && (
                    <div className="text-[10px] text-slate-400 line-through">
                      ${p.compare_at_price.toFixed(2)}
                    </div>
                  )}
                </td>

                <td className="p-3.5">
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {p.tags && p.tags.length > 0 ? (
                      p.tags.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono"
                        >
                          #{t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400">—</span>
                    )}
                  </div>
                </td>

                <td className="p-3.5 text-right space-x-1">
                  <button
                    onClick={() => onEdit(p)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit Product"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDelete(p.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
