import { CartStore, CustomizationType, CartItem } from "@/types/type";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

function areCustomizationsEqual(
  a: CustomizationType[] = [],
  b: CustomizationType[] = []
): boolean {
  if (a.length !== b.length) return false;

  const filterAndDedupe = (arr: CustomizationType[]) => {
    const seen = new Set<string>();
    return arr.filter(item => {
      const key = `${item.$id}-${item.name}-${item.price}-${item.quantity}-${JSON.stringify(item.accompagnement || [])}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((x, y) => x.$id.localeCompare(y.$id));
  };

  const aSorted = filterAndDedupe(a);
  const bSorted = filterAndDedupe(b);

  if (aSorted.length !== bSorted.length) return false;

  return aSorted.every((item, idx) => {
    const bItem = bSorted[idx];
    return (
      item.$id === bItem.$id &&
      item.name === bItem.name &&
      item.price === bItem.price &&
      item.quantity === bItem.quantity &&
      JSON.stringify(item.accompagnement || []) === JSON.stringify(bItem.accompagnement || [])
    );
  });
}

export const UseCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      currentUserId: null,
      userCarts: {},

      setCurrentUser: (userId) => {
        const currentUserId = get().currentUserId;
        
        // Sauvegarder le panier de l'utilisateur précédent
        if (currentUserId) {
          const currentItems = get().items;
          set({
            userCarts: {
              ...get().userCarts,
              [currentUserId]: currentItems
            }
          });
        }

        // Charger le panier du nouvel utilisateur
        const newUserCart = userId ? (get().userCarts[userId] || []) : [];
        
        set({
          currentUserId: userId,
          items: newUserCart
        });
      },

      addItem: (item) => {
        const userId = get().currentUserId;
        if (!userId) {
          console.warn('Aucun utilisateur connecté');
          return;
        }

        const customizations = item.customizations ?? [];

        const existing = get().items.find(
          (i) =>
            i.$id === item.$id &&
            i.restaurantId === item.restaurantId &&
            areCustomizationsEqual(i.customizations ?? [], customizations)
        );

        let updatedItems: CartItem[];

        if (existing) {
          updatedItems = get().items.map((i) =>
            i.$id === item.$id &&
            i.restaurantId === item.restaurantId &&
            areCustomizationsEqual(i.customizations ?? [], customizations)
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        } else {
          updatedItems = [...get().items, { ...item }];
        }

        set({ items: updatedItems });

        // Sauvegarder dans userCarts
        set({
          userCarts: {
            ...get().userCarts,
            [userId]: updatedItems
          }
        });
      },

      updateItem: (id, customizations = [], newData) => {
        const userId = get().currentUserId;
        if (!userId) return;

        const items = get().items;
        
        const itemIndex = items.findIndex(
          (i) =>
            i.$id === id &&
            areCustomizationsEqual(i.customizations ?? [], customizations)
        );

        if (itemIndex === -1) return;

        if (newData.quantity === 0) {
          const updatedItems = [...items];
          updatedItems.splice(itemIndex, 1);
          set({ items: updatedItems });
          
          set({
            userCarts: {
              ...get().userCarts,
              [userId]: updatedItems
            }
          });
          return;
        }

        const newCustomizations = newData.customizations ?? customizations;
        const existingWithNewCustoms = items.findIndex(
          (i, idx) =>
            idx !== itemIndex && 
            i.$id === id &&
            i.restaurantId === items[itemIndex].restaurantId &&
            areCustomizationsEqual(i.customizations ?? [], newCustomizations)
        );

        let updatedItems = [...items];

        if (existingWithNewCustoms !== -1) {
          updatedItems[existingWithNewCustoms] = {
            ...updatedItems[existingWithNewCustoms],
            quantity: updatedItems[existingWithNewCustoms].quantity + (newData.quantity ?? items[itemIndex].quantity),
            instructions: newData.instructions || updatedItems[existingWithNewCustoms].instructions,
          };
          updatedItems.splice(itemIndex, 1);
        } else {
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            ...newData,
          };
        }

        set({ items: updatedItems });

        set({
          userCarts: {
            ...get().userCarts,
            [userId]: updatedItems
          }
        });
      },

      removeItem: (id, customizations = []) => {
        const userId = get().currentUserId;
        if (!userId) return;

        const updatedItems = get().items.filter(
          (i) =>
            !(
              i.$id === id &&
              areCustomizationsEqual(i.customizations ?? [], customizations)
            )
        );

        set({ items: updatedItems });

        set({
          userCarts: {
            ...get().userCarts,
            [userId]: updatedItems
          }
        });
      },

      increaseQty: (id, customizations = []) => {
        const userId = get().currentUserId;
        if (!userId) return;

        const updatedItems = get().items.map((i) =>
          i.$id === id &&
          areCustomizationsEqual(i.customizations ?? [], customizations)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );

        set({ items: updatedItems });

        set({
          userCarts: {
            ...get().userCarts,
            [userId]: updatedItems
          }
        });
      },

      decreaseQty: (id, customizations = []) => {
        const userId = get().currentUserId;
        if (!userId) return;

        const updatedItems = get()
          .items.map((i) =>
            i.$id === id &&
            areCustomizationsEqual(i.customizations ?? [], customizations)
              ? { ...i, quantity: i.quantity - 1 }
              : i
          )
          .filter((i) => i.quantity > 0);

        set({ items: updatedItems });

        set({
          userCarts: {
            ...get().userCarts,
            [userId]: updatedItems
          }
        });
      },

      clearCart: (restaurantId) => {
        const userId = get().currentUserId;
        if (!userId) return;

        const updatedItems = get().items.filter((i) => i.restaurantId !== restaurantId);

        set({ items: updatedItems });

        set({
          userCarts: {
            ...get().userCarts,
            [userId]: updatedItems
          }
        });
      },

      getTotalItems: (restaurantId) => {
        return get()
          .items.filter((i) => i.restaurantId === restaurantId)
          .reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: (restaurantId) => {
        return get()
          .items.filter((i) => i.restaurantId === restaurantId)
          .reduce((total, item) => {
            
            const basePrice = item.normalPrice === item.reductionPrice 
              ? item.normalPrice 
              : item.reductionPrice;

            
            const customPrice = item.customizations?.reduce(
              (sum, c) => sum + c.price * c.quantity,
              0
            ) ?? 0;
            
            
            const itemTotal = (basePrice + customPrice) * item.quantity;
            
            return total + itemTotal;
          }, 0);
      },
      getCartCount: () => {
        const restaurantIds = new Set(
          get().items.map((item) => item.restaurantId)
        );
        return restaurantIds.size;
      },

      getRestaurantIds: () => {
        return Array.from(
          new Set(get().items.map((item) => item.restaurantId))
        );
      },
    }),

    {
      name: "cart-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);