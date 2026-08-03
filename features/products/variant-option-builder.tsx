"use client";

import { useState } from "react";
import { Plus, Trash2, Layers, Sparkles } from "lucide-react";

export interface OptionDraft {
  name: string;
  values: string[];
  position: number;
}

export interface VariantDraft {
  title: string;
  options: Record<string, string>;
  price: number;
  compare_at_price?: number;
  cost_per_item?: number;
  sku?: string;
  barcode?: string;
  stock_quantity: number;
}

interface VariantOptionBuilderProps {
  basePrice: number;
  baseSku?: string;
  options: OptionDraft[];
  variants: VariantDraft[];
  onOptionsChange: (options: OptionDraft[]) => void;
  onVariantsChange: (variants: VariantDraft[]) => void;
}

export function VariantOptionBuilder({
  basePrice,
  baseSku,
  options,
  variants,
  onOptionsChange,
  onVariantsChange,
}: VariantOptionBuilderProps) {
  const [chipInputs, setChipInputs] = useState<Record<number, string>>({});

  // Helper function: Generate Cartesian Product of Option Values
  const generateCartesianVariants = (opts: OptionDraft[]): VariantDraft[] => {
    const validOpts = opts.filter((o) => o.name.trim() && o.values.length > 0);
    if (validOpts.length === 0) return [];

    const cartesian = (arr: string[][]): string[][] => {
      return arr.reduce<string[][]>(
        (a, b) => a.flatMap((d) => b.map((e) => [...d, e])),
        [[]]
      );
    };

    const valueArrays = validOpts.map((o) => o.values);
    const combinations = cartesian(valueArrays);

    return combinations.map((combo) => {
      const optionMap: Record<string, string> = {};
      combo.forEach((val, idx) => {
        optionMap[validOpts[idx].name] = val;
      });

      const title = combo.join(" / ");
      const existing = variants.find((v) => v.title === title);

      return {
        title,
        options: optionMap,
        price: existing?.price ?? basePrice ?? 0,
        compare_at_price: existing?.compare_at_price,
        cost_per_item: existing?.cost_per_item,
        sku: existing?.sku ?? (baseSku ? `${baseSku}-${combo.join("-").toLowerCase()}` : ""),
        barcode: existing?.barcode,
        stock_quantity: existing?.stock_quantity ?? 10,
      };
    });
  };

  const handleAddOption = () => {
    const newOptions: OptionDraft[] = [
      ...options,
      { name: "", values: [], position: options.length },
    ];
    onOptionsChange(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    const updated = options.filter((_, idx) => idx !== index).map((o, i) => ({ ...o, position: i }));
    onOptionsChange(updated);
    onVariantsChange(generateCartesianVariants(updated));
  };

  const handleOptionNameChange = (index: number, name: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], name };
    onOptionsChange(updated);
    onVariantsChange(generateCartesianVariants(updated));
  };

  const handleAddValue = (index: number) => {
    const val = (chipInputs[index] || "").trim();
    if (!val) return;

    const updated = [...options];
    if (!updated[index].values.includes(val)) {
      updated[index].values = [...updated[index].values, val];
      onOptionsChange(updated);
      onVariantsChange(generateCartesianVariants(updated));
    }
    setChipInputs({ ...chipInputs, [index]: "" });
  };

  const handleRemoveValue = (optionIndex: number, valueIndex: number) => {
    const updated = [...options];
    updated[optionIndex].values = updated[optionIndex].values.filter((_, i) => i !== valueIndex);
    onOptionsChange(updated);
    onVariantsChange(generateCartesianVariants(updated));
  };

  const handleVariantFieldChange = (
    variantIndex: number,
    field: keyof VariantDraft,
    val: string | number
  ) => {
    const updated = [...variants];
    updated[variantIndex] = { ...updated[variantIndex], [field]: val };
    onVariantsChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Normalized Product Variants
          </h3>
          <p className="text-xs text-slate-400">
            Define generic option attributes (e.g. Size, Material, Color, Finish, Weight). Combinations are auto-generated.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddOption}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Option Attribute
        </button>
      </div>

      {/* Option Attributes Builder */}
      {options.length > 0 && (
        <div className="space-y-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
          {options.map((opt, optIdx) => (
            <div key={optIdx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Option Name (e.g. Size, Material, Color)"
                  value={opt.name}
                  onChange={(e) => handleOptionNameChange(optIdx, e.target.value)}
                  className="text-xs px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 font-medium placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(optIdx)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Value Chips & Input */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {opt.values.map((v, vIdx) => (
                  <span
                    key={vIdx}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 text-emerald-300 border border-slate-700 rounded-full"
                  >
                    {v}
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(optIdx, vIdx)}
                      className="hover:text-rose-400"
                    >
                      &times;
                    </button>
                  </span>
                ))}

                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Add value (press Enter)"
                    value={chipInputs[optIdx] || ""}
                    onChange={(e) => setChipInputs({ ...chipInputs, [optIdx]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddValue(optIdx);
                      }
                    }}
                    className="text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddValue(optIdx)}
                    className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generated Variant Combination Matrix */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Generated Variant Combinations ({variants.length})
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-3">Variant Title</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Price ($)</th>
                  <th className="p-3">Compare Price</th>
                  <th className="p-3">Stock Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-200">
                {variants.map((v, vIdx) => (
                  <tr key={vIdx} className="hover:bg-slate-900/50">
                    <td className="p-3 font-medium text-emerald-400">{v.title}</td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={v.sku || ""}
                        onChange={(e) => handleVariantFieldChange(vIdx, "sku", e.target.value)}
                        className="w-28 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.01"
                        value={v.price}
                        onChange={(e) => handleVariantFieldChange(vIdx, "price", parseFloat(e.target.value) || 0)}
                        className="w-24 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.01"
                        value={v.compare_at_price || ""}
                        onChange={(e) =>
                          handleVariantFieldChange(vIdx, "compare_at_price", parseFloat(e.target.value) || 0)
                        }
                        className="w-24 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={v.stock_quantity}
                        onChange={(e) => handleVariantFieldChange(vIdx, "stock_quantity", parseInt(e.target.value) || 0)}
                        className="w-20 text-xs px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
