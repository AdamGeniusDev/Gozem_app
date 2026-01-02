import { useEffect, useRef } from "react";
import { appwriteConfig, client } from "./appwrite";
import { Order } from "@/types/type";

interface RealtimeResponse {
  events: string[];
  payload: Order;
}

export const useRealtimeOrderStatus = (
  orderId: string,
  onStatusChange?: (newStatus: string, oldStatus: string | null) => void
) => {
  const previousStatus = useRef<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = client.subscribe(
      [
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.ordersCollectionId}.documents.${orderId}`
      ],
      (response: RealtimeResponse) => {
        const order = response.payload;
        const newStatus = order.status;
        const oldStatus = previousStatus.current;

        if (oldStatus !== newStatus) {
          console.log(`🔄 Statut de ${orderId}: ${oldStatus} → ${newStatus}`);
          previousStatus.current = newStatus;
          onStatusChange?.(newStatus, oldStatus);
        }
      }
    );


    return () => {
      unsubscribe();
      previousStatus.current = null;
    };
  }, [orderId, onStatusChange]);
};