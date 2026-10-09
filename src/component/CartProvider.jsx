"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "every-step-cart";

const customizedImage = (item) =>
  item.customizedImageUrl ||
  item.customized_image_url ||
  item.customImageUrl ||
  item.custom_image_url ||
  item.finalImageUrl ||
  item.final_image_url ||
  item.previewImageUrl ||
  item.preview_image_url ||
  null;

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch (error) {
      console.warn("Could not restore cart", error);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Could not save cart", error);
    }
  }, [items, ready]);

  function addItem(item) {
    const savedImage = customizedImage(item);
    const nextItem = {
      ...item,
      quantity: Math.max(1, Number(item.quantity) || 1),
      ...(savedImage ? { customizedImageUrl: savedImage } : {}),
    };

    setItems((current) => {
      const same = current.find(
        (x) =>
          x.productId === nextItem.productId &&
          x.size === nextItem.size &&
          x.color === nextItem.color &&
          x.image === nextItem.image &&
          customizedImage(x) === customizedImage(nextItem)
      );

      if (same) {
        return current.map((x) =>
          x.cartId === same.cartId
            ? { ...x, quantity: x.quantity + nextItem.quantity }
            : x
        );
      }

      return [...current, { ...nextItem, cartId: crypto.randomUUID() }];
    });
  }

  function updateQuantity(cartId, quantity) {
    setItems((current) =>
      current.map((item) =>
        item.cartId === cartId
          ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
          : item
      )
    );
  }

  function removeItem(cartId) {
    setItems((current) => current.filter((item) => item.cartId !== cartId));
  }

  function clearCart() {
    setItems([]);
  }

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      count: items.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
      total: items.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
        0
      ),
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}