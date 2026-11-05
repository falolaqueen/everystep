"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const money = (n) => `₦${Number(n || 0).toLocaleString("en-NG")}`;

const statuses = [
  "submitted",
  "reviewing",
  "needs_materials",
  "quoted",
  "accepted",
  "in_production",
  "completed",
  "declined",
];

const solePreferences = [
  "Nigerian soles",
  "Foreign soles",
  "No preference",
];

const pretty = (s) => String(s || "").replaceAll("_", " ");

const wa = (phone, message) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : null;
};

export default function AdminCustomOrders() {
  const [data, setData] = useState({
    orders: [],
    categories: [],
    materials: [],
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [categoryDrafts, setCategoryDrafts] = useState({});
  const [materialDrafts, setMaterialDrafts] = useState({});
  const [orderDrafts, setOrderDrafts] = useState({});

  const [newCategory, setNewCategory] = useState({
    name: "",
    nigeriaSolePrice: "",
    foreignSolePrice: "",
  });

  const [newMaterial, setNewMaterial] = useState({
    name: "",
    unitCost: "",
    notes: "",
  });

  async function load() {
    const response = await fetch("/api/admin/custom-designs", {
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to load custom orders.");
    }

    setData({
      orders: result.orders || [],
      categories: result.categories || [],
      materials: result.materials || [],
    });
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function post(body) {
    const response = await fetch("/api/admin/custom-designs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to save changes.");
    }

    return result;
  }

  const patch = (id, key, value) => {
    setOrderDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        [key]: value,
      },
    }));
  };

  const materialById = useMemo(
    () => new Map(data.materials.map((material) => [material.id, material])),
    [data.materials]
  );

  async function saveCategory(category, draft = {}) {
    setBusy(category.id || "new-category");
    setError("");

    try {
      await post({
        action: "save-category",
        id: category.id,
        name: draft.name ?? category.name,
        nigeriaSolePrice:
          draft.nigeriaSolePrice ?? category.nigeria_sole_price ?? 0,
        foreignSolePrice:
          draft.foreignSolePrice ?? category.foreign_sole_price ?? 0,
        isActive: draft.isActive ?? category.is_active,
        sortOrder: category.sort_order,
      });

      await load();

      if (!category.id) {
        setNewCategory({
          name: "",
          nigeriaSolePrice: "",
          foreignSolePrice: "",
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function saveMaterial(material, draft = {}) {
    setBusy(material.id || "new-material");
    setError("");

    try {
      await post({
        action: "save-material",
        id: material.id,
        name: draft.name ?? material.name,
        unitCost: draft.unitCost ?? material.unit_cost,
        isAvailable: draft.isAvailable ?? material.is_available,
        notes: draft.notes ?? material.notes,
        alternativeIds:
          draft.alternativeIds ?? material.alternative_ids ?? [],
      });

      await load();

      if (!material.id) {
        setNewMaterial({ name: "", unitCost: "", notes: "" });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function classify(order) {
    setBusy(order.id);
    setError("");

    try {
      const result = await post({
        action: "classify",
        orderId: order.id,
      });

      patch(order.id, "category", result.category);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function saveOrder(order, makeQuote = false) {
    const draft = orderDrafts[order.id] || {};

    setBusy(order.id);
    setError("");

    try {
      await post({
        action: "update-order",
        orderId: order.id,
        category: draft.category || order.category,
        solePreference:
          draft.solePreference ||
          order.sole_preference ||
          "No preference",
        status: makeQuote
          ? "quoted"
          : draft.status || order.status,
        materialIds:
          draft.materialIds || order.selected_material_ids || [],
        adminNote: draft.adminNote ?? order.admin_note,
        quoteAmount: makeQuote ? undefined : draft.quoteAmount,
        makeQuote,
      });

      await load();

      setOrderDrafts((current) => ({
        ...current,
        [order.id]: {},
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  const selected = (order) =>
    orderDrafts[order.id]?.materialIds ??
    order.selected_material_ids ??
    [];

  function whatsappMessage(order) {
    const chosen = selected(order)
      .map((id) => materialById.get(id))
      .filter(Boolean);

    const unavailable = chosen.filter(
      (material) => !material.is_available
    );

    const alternatives = [
      ...new Set(
        unavailable.flatMap((material) => material.alternative_ids || [])
      ),
    ]
      .map((id) => materialById.get(id))
      .filter((material) => material?.is_available);

    if (unavailable.length) {
      return `Hello ${order.customer_name}, thank you for your Every Step custom footwear request. ${unavailable
        .map((material) => material.name)
        .join(", ")} is currently unavailable. We can offer: ${
        alternatives.length
          ? alternatives.map((material) => material.name).join(", ")
          : "other available material options"
      }. Please let us know which alternative you prefer. We will confirm the final quotation after your choice. 🧡`;
    }

    return `Hello ${order.customer_name}, your Every Step custom footwear design has been reviewed. ${
      order.quote_amount != null
        ? `Your current quotation is ${money(order.quote_amount)}.`
        : "We are preparing your quotation."
    } Please reply to confirm whether you would like us to proceed. 🧡`;
  }

  return (
    <main className="min-h-screen bg-[#FFF9F4] px-4 py-10 text-[#2A211C]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#C9683F]">
              Every Step Studio
            </p>
            <h1 className="mt-1 text-3xl font-black">
              Custom design orders
            </h1>
            <p className="mt-2 text-sm text-black/50">
              Review designs, manage materials and prepare quotations.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => load().catch((e) => setError(e.message))}
              className="rounded-full bg-[#F4A261] px-4 py-3 text-sm font-black"
            >
              Refresh
            </button>
            <Link
              href="/admin/orders"
              className="rounded-full bg-white px-4 py-3 text-sm font-black"
            >
              Orders
            </Link>
            <Link
              href="/admin"
              className="rounded-full bg-[#2A211C] px-4 py-3 text-sm font-black text-white"
            >
              Studio
            </Link>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {/* CATEGORY PRICING */}
        <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-black">
            Pricing by footwear category
          </h2>
          <p className="mt-1 text-sm text-black/50">
            Set a separate Nigerian sole and foreign sole price for every
            footwear category. The customer's preference determines which
            price is used in the quotation.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {data.categories.map((category) => {
              const draft = categoryDrafts[category.id] || {};

              return (
                <div
                  key={category.id}
                  className="rounded-2xl bg-[#FFF8F1] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black">{category.name}</p>

                    <label className="text-xs">
                      <input
                        type="checkbox"
                        checked={draft.isActive ?? category.is_active}
                        onChange={(e) =>
                          setCategoryDrafts((current) => ({
                            ...current,
                            [category.id]: {
                              ...draft,
                              isActive: e.target.checked,
                            },
                          }))
                        }
                      />{" "}
                      Active
                    </label>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="text-xs font-bold">
                      Nigerian sole price (₦)
                      <input
                        type="number"
                        min="0"
                        value={
                          draft.nigeriaSolePrice ??
                          category.nigeria_sole_price ??
                          0
                        }
                        onChange={(e) =>
                          setCategoryDrafts((current) => ({
                            ...current,
                            [category.id]: {
                              ...draft,
                              nigeriaSolePrice: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-lg bg-white p-2"
                      />
                    </label>

                    <label className="text-xs font-bold">
                      Foreign sole price (₦)
                      <input
                        type="number"
                        min="0"
                        value={
                          draft.foreignSolePrice ??
                          category.foreign_sole_price ??
                          0
                        }
                        onChange={(e) =>
                          setCategoryDrafts((current) => ({
                            ...current,
                            [category.id]: {
                              ...draft,
                              foreignSolePrice: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-lg bg-white p-2"
                      />
                    </label>
                  </div>

                  <button
                    disabled={!!busy}
                    onClick={() => saveCategory(category, draft)}
                    className="mt-3 rounded-full bg-[#2A211C] px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                  >
                    {busy === category.id ? "Saving..." : "Save category"}
                  </button>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              saveCategory(
                {
                  name: newCategory.name,
                  nigeria_sole_price: 0,
                  foreign_sole_price: 0,
                  is_active: true,
                  sort_order: data.categories.length + 1,
                },
                newCategory
              );
            }}
            className="mt-4 grid gap-2 rounded-2xl border border-dashed border-[#E9C9B2] p-4 sm:grid-cols-4"
          >
            <input
              required
              placeholder="New footwear category"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory((current) => ({
                  ...current,
                  name: e.target.value,
                }))
              }
              className="rounded-lg bg-[#FFF8F1] p-3 text-sm"
            />

            <input
              required
              type="number"
              min="0"
              placeholder="Nigerian sole price ₦"
              value={newCategory.nigeriaSolePrice}
              onChange={(e) =>
                setNewCategory((current) => ({
                  ...current,
                  nigeriaSolePrice: e.target.value,
                }))
              }
              className="rounded-lg bg-[#FFF8F1] p-3 text-sm"
            />

            <input
              required
              type="number"
              min="0"
              placeholder="Foreign sole price ₦"
              value={newCategory.foreignSolePrice}
              onChange={(e) =>
                setNewCategory((current) => ({
                  ...current,
                  foreignSolePrice: e.target.value,
                }))
              }
              className="rounded-lg bg-[#FFF8F1] p-3 text-sm"
            />

            <button
              disabled={!!busy}
              className="rounded-full bg-[#F4A261] px-4 py-3 text-sm font-black disabled:opacity-50"
            >
              Add category
            </button>
          </form>
        </section>

        {/* MATERIALS */}
        <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-black">Materials inventory</h2>
          <p className="mt-1 text-sm text-black/50">
            Add materials, set their cost per pair, mark availability and link
            alternatives.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {data.materials.map((material) => {
              const draft = materialDrafts[material.id] || {};
              const alternatives =
                draft.alternativeIds ??
                material.alternative_ids ??
                [];

              return (
                <div
                  key={material.id}
                  className="rounded-2xl bg-[#FFF8F1] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={draft.name ?? material.name}
                      onChange={(e) =>
                        setMaterialDrafts((current) => ({
                          ...current,
                          [material.id]: {
                            ...draft,
                            name: e.target.value,
                          },
                        }))
                      }
                      className="min-w-0 flex-1 rounded-lg bg-white p-2 font-bold"
                    />

                    <label className="shrink-0 text-xs">
                      <input
                        type="checkbox"
                        checked={
                          draft.isAvailable ?? material.is_available
                        }
                        onChange={(e) =>
                          setMaterialDrafts((current) => ({
                            ...current,
                            [material.id]: {
                              ...draft,
                              isAvailable: e.target.checked,
                            },
                          }))
                        }
                      />{" "}
                      Available
                    </label>
                  </div>

                  <label className="mt-3 block text-xs font-bold">
                    Cost per pair (₦)
                    <input
                      type="number"
                      min="0"
                      value={draft.unitCost ?? material.unit_cost}
                      onChange={(e) =>
                        setMaterialDrafts((current) => ({
                          ...current,
                          [material.id]: {
                            ...draft,
                            unitCost: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 w-full rounded-lg bg-white p-2"
                    />
                  </label>

                  <label className="mt-3 block text-xs font-bold">
                    Alternatives (select all that can replace this)
                    <select
                      multiple
                      value={alternatives}
                      onChange={(e) =>
                        setMaterialDrafts((current) => ({
                          ...current,
                          [material.id]: {
                            ...draft,
                            alternativeIds: Array.from(
                              e.target.selectedOptions
                            ).map((option) => option.value),
                          },
                        }))
                      }
                      className="mt-1 min-h-20 w-full rounded-lg bg-white p-2"
                    >
                      {data.materials
                        .filter((item) => item.id !== material.id)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                  </label>

                  <input
                    value={draft.notes ?? material.notes ?? ""}
                    onChange={(e) =>
                      setMaterialDrafts((current) => ({
                        ...current,
                        [material.id]: {
                          ...draft,
                          notes: e.target.value,
                        },
                      }))
                    }
                    placeholder="Notes (optional)"
                    className="mt-2 w-full rounded-lg bg-white p-2 text-xs"
                  />

                  <button
                    disabled={!!busy}
                    onClick={() => saveMaterial(material, draft)}
                    className="mt-3 rounded-full bg-[#2A211C] px-4 py-2 text-xs font-black text-white"
                  >
                    Save material
                  </button>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              saveMaterial(
                {
                  name: newMaterial.name,
                  unit_cost: 0,
                  is_available: true,
                  notes: "",
                },
                newMaterial
              );
            }}
            className="mt-4 grid gap-2 rounded-2xl border border-dashed border-[#E9C9B2] p-4 sm:grid-cols-3"
          >
            <input
              required
              placeholder="Material name"
              value={newMaterial.name}
              onChange={(e) =>
                setNewMaterial((current) => ({
                  ...current,
                  name: e.target.value,
                }))
              }
              className="rounded-lg bg-[#FFF8F1] p-3 text-sm"
            />

            <input
              required
              type="number"
              min="0"
              placeholder="Cost per pair ₦"
              value={newMaterial.unitCost}
              onChange={(e) =>
                setNewMaterial((current) => ({
                  ...current,
                  unitCost: e.target.value,
                }))
              }
              className="rounded-lg bg-[#FFF8F1] p-3 text-sm"
            />

            <button
              disabled={!!busy}
              className="rounded-full bg-[#F4A261] px-4 py-3 text-sm font-black"
            >
              Add material
            </button>
          </form>
        </section>

        {/* CUSTOMER REQUESTS */}
        <section className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black">Customer requests</h2>
              <p className="mt-1 text-sm text-black/50">
                {data.orders.length} custom design requests
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-5">
            {data.orders.map((order) => {
              const draft = orderDrafts[order.id] || {};
              const chosenIds = selected(order);

              const unavailable = chosenIds
                .map((id) => materialById.get(id))
                .filter((material) => material && !material.is_available);

              const alternatives = [
                ...new Set(
                  unavailable.flatMap(
                    (material) => material.alternative_ids || []
                  )
                ),
              ]
                .map((id) => materialById.get(id))
                .filter((material) => material?.is_available);

              const preference =
                draft.solePreference ||
                order.sole_preference ||
                "No preference";

              const link = wa(order.whatsapp_number, whatsappMessage(order));

              return (
                <article
                  key={order.id}
                  className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-[#C9683F]">
                        {new Date(order.created_at).toLocaleString("en-NG")}
                      </p>

                      <h3 className="mt-1 text-xl font-black">
                        {order.customer_name}
                      </h3>

                      <p className="mt-1 text-sm text-black/55">
                        WhatsApp: {order.whatsapp_number} · Size {order.size} ·{" "}
                        {order.quantity} pair(s)
                      </p>
                    </div>

                    <span className="rounded-full bg-[#FFF3E8] px-4 py-2 text-xs font-black capitalize">
                      {pretty(order.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,1fr)]">
                    <div>
                      <p className="text-sm font-black">Reference photos</p>

                      {order.photos?.length ? (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {order.photos.map((url, index) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={url}
                                alt={`Customer design reference ${index + 1}`}
                                className="aspect-square w-full rounded-xl bg-[#FFF8F1] object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-black/40">
                          No photos uploaded.
                        </p>
                      )}

                      <p className="mt-4 text-sm font-black">
                        Customer specifications
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-black/65">
                        {order.specifications}
                      </p>

                      {order.style_range && (
                        <p className="mt-2 text-xs text-black/50">
                          Style / range: {order.style_range}
                        </p>
                      )}

                      <button
                        disabled={!!busy || !order.photos?.length}
                        onClick={() => classify(order)}
                        className="mt-4 rounded-full border border-[#E9C9B2] px-4 py-2 text-xs font-black disabled:opacity-40"
                      >
                        {busy === order.id
                          ? "Checking..."
                          : "AI suggest footwear type"}
                      </button>

                      {order.ai_suggested_category && (
                        <p className="mt-2 rounded-xl bg-[#FFF3E8] p-3 text-xs">
                          AI suggestion:{" "}
                          <b>{order.ai_suggested_category}</b> (
                          {Math.round(
                            Number(order.ai_confidence || 0) * 100
                          )}
                          % confidence). Confirm it in the category selector
                          if correct.
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-[#FFF8F1] p-4">
                      <label className="block text-xs font-black">
                        Footwear category
                        <select
                          value={draft.category ?? order.category ?? ""}
                          onChange={(e) =>
                            patch(order.id, "category", e.target.value)
                          }
                          className="mt-2 w-full rounded-xl bg-white p-3 text-sm"
                        >
                          {data.categories
                            .filter((category) => category.is_active)
                            .map((category) => (
                              <option key={category.id} value={category.name}>
                                {category.name}
                              </option>
                            ))}
                        </select>
                      </label>

                      <label className="mt-4 block text-xs font-black">
                        Customer's sole preference
                        <select
                          value={preference}
                          onChange={(e) =>
                            patch(
                              order.id,
                              "solePreference",
                              e.target.value
                            )
                          }
                          className="mt-2 w-full rounded-xl bg-white p-3 text-sm"
                        >
                          {solePreferences.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="mt-3 rounded-xl bg-white p-3 text-xs">
                        {(() => {
                          const category = data.categories.find(
                            (item) =>
                              item.name ===
                              (draft.category || order.category)
                          );

                          if (!category) {
                            return "Select a category to view its sole prices.";
                          }

                          return (
                            <div className="space-y-1">
                              <p>
                                Nigerian sole:{" "}
                                <b>
                                  {money(category.nigeria_sole_price)}
                                </b>
                              </p>
                              <p>
                                Foreign sole:{" "}
                                <b>
                                  {money(category.foreign_sole_price)}
                                </b>
                              </p>
                              <p className="pt-1 text-black/50">
                                {preference === "No preference"
                                  ? "Choose a sole preference before calculating the quotation."
                                  : `Quotation will use the ${preference.toLowerCase()} price.`}
                              </p>
                            </div>
                          );
                        })()}
                      </div>

                      <p className="mt-4 text-xs font-black">
                        Materials for this design
                      </p>

                      <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                        {data.materials.map((material) => (
                          <label
                            key={material.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-white p-2 text-xs"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <input
                                type="checkbox"
                                checked={chosenIds.includes(material.id)}
                                onChange={(e) =>
                                  patch(
                                    order.id,
                                    "materialIds",
                                    e.target.checked
                                      ? [...chosenIds, material.id]
                                      : chosenIds.filter(
                                          (id) => id !== material.id
                                        )
                                  )
                                }
                              />

                              <span>
                                {material.name}
                                <span className="ml-1 text-black/40">
                                  {money(material.unit_cost)}
                                </span>
                              </span>
                            </span>

                            <span
                              className={
                                material.is_available
                                  ? "text-green-700"
                                  : "font-black text-red-600"
                              }
                            >
                              {material.is_available ? "Available" : "Out"}
                            </span>
                          </label>
                        ))}
                      </div>

                      {unavailable.length > 0 && (
                        <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-800">
                          <b>Material unavailable:</b>{" "}
                          {unavailable
                            .map((material) => material.name)
                            .join(", ")}
                          <p className="mt-1">
                            Suggested alternatives:{" "}
                            {alternatives.length
                              ? alternatives
                                  .map((material) => material.name)
                                  .join(", ")
                              : "Add alternatives in Materials inventory."}
                          </p>
                        </div>
                      )}

                      <label className="mt-4 block text-xs font-black">
                        Order status
                        <select
                          value={draft.status ?? order.status}
                          onChange={(e) =>
                            patch(order.id, "status", e.target.value)
                          }
                          className="mt-2 w-full rounded-xl bg-white p-3 text-sm"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {pretty(status)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="mt-3 block text-xs font-black">
                        Quotation amount (₦)
                        <input
                          type="number"
                          min="0"
                          value={
                            draft.quoteAmount ?? order.quote_amount ?? ""
                          }
                          onChange={(e) =>
                            patch(order.id, "quoteAmount", e.target.value)
                          }
                          placeholder="Set manually or calculate below"
                          className="mt-2 w-full rounded-xl bg-white p-3 text-sm"
                        />
                      </label>

                      <label className="mt-3 block text-xs font-black">
                        Internal / customer note
                        <textarea
                          rows={2}
                          value={draft.adminNote ?? order.admin_note ?? ""}
                          onChange={(e) =>
                            patch(order.id, "adminNote", e.target.value)
                          }
                          className="mt-2 w-full rounded-xl bg-white p-3 text-sm"
                        />
                      </label>

                      <p className="mt-3 text-xs text-black/45">
                        Last quote:{" "}
                        {order.quote_amount == null
                          ? "Not quoted"
                          : money(order.quote_amount)}
                      </p>

                      <div className="mt-4 grid gap-2">
                        <button
                          disabled={
                            !!busy ||
                            unavailable.length > 0 ||
                            !["Nigerian soles", "Foreign soles"].includes(
                              preference
                            )
                          }
                          onClick={() => saveOrder(order, true)}
                          className="rounded-full bg-[#F4A261] px-4 py-3 text-sm font-black disabled:opacity-40"
                        >
                          Calculate & save quotation
                        </button>

                        <button
                          disabled={!!busy}
                          onClick={() => saveOrder(order, false)}
                          className="rounded-full bg-[#2A211C] px-4 py-3 text-sm font-black text-white disabled:opacity-40"
                        >
                          Save changes
                        </button>

                        {link && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#2A211C] px-4 py-3 text-center text-sm font-black"
                          >
                            Message customer on WhatsApp ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {!data.orders.length && (
              <p className="rounded-3xl bg-white p-10 text-center text-sm text-black/45">
                No custom design requests yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}