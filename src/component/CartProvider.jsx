// "use client";

// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
// } from "react";

// const CartContext = createContext(null);

// const STORAGE_KEY = "every-step-cart";

// export function CartProvider({ children }) {
//   const [cart, setCart] = useState([]);

//   const [ready, setReady] =
//     useState(false);

//   useEffect(() => {
//     try {
//       const saved =
//         localStorage.getItem(
//           STORAGE_KEY
//         );

//       if (saved) {
//         setCart(
//           JSON.parse(saved)
//         );
//       }
//     } catch (error) {
//       console.error(
//         "Could not load cart",
//         error
//       );
//     }

//     setReady(true);
//   }, []);

//   useEffect(() => {
//     if (!ready) return;

//     localStorage.setItem(
//       STORAGE_KEY,
//       JSON.stringify(cart)
//     );
//   }, [cart, ready]);

//   function addToCart(item) {
//     const cartItem = {
//       cartId:
//         item.cartId ||
//         `${item.productId}-${item.size}-${item.color}-${Date.now()}`,

//       ...item,
//     };

//     setCart((previous) => [
//       ...previous,
//       cartItem,
//     ]);
//   }

//   function removeFromCart(cartId) {
//     setCart((previous) =>
//       previous.filter(
//         (item) =>
//           item.cartId !== cartId
//       )
//     );
//   }

//   function updateQuantity(
//     cartId,
//     quantity
//   ) {
//     if (quantity <= 0) {
//       removeFromCart(cartId);
//       return;
//     }

//     setCart((previous) =>
//       previous.map((item) =>
//         item.cartId === cartId
//           ? {
//               ...item,
//               quantity,
//             }
//           : item
//       )
//     );
//   }

//   function clearCart() {
//     setCart([]);
//   }

//   const total = cart.reduce(
//     (sum, item) =>
//       sum +
//       Number(item.price || 0) *
//         Number(item.quantity || 1),
//     0
//   );

//   return (
//     <CartContext.Provider
//       value={{
//         cart,
//         addToCart,
//         removeFromCart,
//         updateQuantity,
//         clearCart,
//         total,
//         itemCount: cart.reduce(
//           (sum, item) =>
//             sum +
//             Number(
//               item.quantity || 1
//             ),
//           0
//         ),
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// }

// export function useCart() {
//   const context =
//     useContext(CartContext);

//   if (!context) {
//     throw new Error(
//       "useCart must be used inside CartProvider"
//     );
//   }

//   return context;
// }

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "every-step-cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch (error) {
      console.warn("Could not restore cart", error);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  function addItem(item) {
    setItems((current) => {
      const same = current.find(
        (x) =>
          x.productId === item.productId &&
          x.size === item.size &&
          x.color === item.color &&
          x.image === item.image
      );

      if (same) {
        return current.map((x) =>
          x.cartId === same.cartId
            ? { ...x, quantity: x.quantity + item.quantity }
            : x
        );
      }

      return [...current, { ...item, cartId: crypto.randomUUID() }];
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
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
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