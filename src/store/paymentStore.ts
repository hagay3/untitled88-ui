import { create } from "zustand";
import { PaymentDetails } from "./Payment.types";
import {callApi, getOrGenerateDeviceId} from "@/utils/actions";

interface PaymentState {
  paymentDetails: PaymentDetails | null;
  loading: boolean;
  fetchPaymentDetails: (userId: string, token: string) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  paymentDetails: null,
  loading: false,

  fetchPaymentDetails: async (userId, token) => {
    set({ loading: true });

    try {
      const deviceId = await getOrGenerateDeviceId();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fetch_plan_and_records_details`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: userId, device_type: "desktop", device_id: deviceId }),
        }
      );

      if (!res.ok) {
        set({ loading: false });
        callApi(
          "send_error",
          {
            user_id: userId,
            message: "Failed to fetch payment details",
            error: String(res.statusText),
          }
        );
        return;
      }

      const data: PaymentDetails = await res.json();
      
      set({ paymentDetails: data, loading: false });
    } catch (error) {
      set({ loading: false });
      callApi(
        "send_error",
        {
          user_id: userId,
          message: "Failed to fetch payment details",
          error: String(error),
        }
      );
    }
  },
}));

