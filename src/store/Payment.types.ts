export interface PaymentDetails {
  next_billing_date: string; // ISO date string
  payment_amount: number;
  payment_details_link: string;
  payment_exists: boolean;
  payment_valid: boolean;
  plan: "free" | "one_time" | "advanced" | "professional" | "gold";
  plan_start_date: string; // ISO date string
  previous_billing_date: string | null; // Nullable date string
  records_limit: number; // -1 for unlimited
  records_used: number | null;
  recurring: "one_time" | "monthly" | "annually" | null;
  valid_for_next_record: boolean;
  user_name: string | null;
  valid_device: boolean;
}

