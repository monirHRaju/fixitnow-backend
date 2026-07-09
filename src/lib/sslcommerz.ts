/**
 * SSLCommerz API helpers.
 *
 * Uses native fetch (Node 18+) for all HTTP calls.
 * Ref: https://developer.sslcommerz.com/
 */
import { env } from "../config/env";

const SANDBOX_URL = "https://sandbox.sslcommerz.com";
const LIVE_URL = "https://secure.sslcommerz.com";

function baseUrl(): string {
  return env.SSLC_SANDBOX ? SANDBOX_URL : LIVE_URL;
}

export interface SslcInitParams {
  totalAmount: number;
  currency?: string;
  tranId: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  cusName: string;
  cusEmail: string;
  cusPhone: string;
  cusAdd: string;
  productName: string;
  productCategory: string;
  productProfile: "general" | "physical-goods" | "non-physical-goods" | "airline-tickets" | "travel-vertical" | "telecom-vertical";
}

export interface SslcInitResponse {
  status: "SUCCESS" | "FAILED";
  failedreason?: string;
  gateway_url?: string;
  sessionkey?: string;
}

/**
 * Initiate an SSLCommerz payment session.
 * Returns the gateway redirect URL on success.
 */
export async function initPayment(
  params: SslcInitParams
): Promise<SslcInitResponse> {
  const formData = new URLSearchParams();
  formData.append("store_id", env.SSLC_STORE_ID);
  formData.append("store_passwd", env.SSLC_STORE_PASSWORD);
  formData.append("total_amount", params.totalAmount.toString());
  formData.append("currency", params.currency ?? "BDT");
  formData.append("tran_id", params.tranId);
  formData.append("success_url", params.successUrl);
  formData.append("fail_url", params.failUrl);
  formData.append("cancel_url", params.cancelUrl);
  formData.append("cus_name", params.cusName);
  formData.append("cus_email", params.cusEmail);
  formData.append("cus_phone", params.cusPhone);
  formData.append("cus_add1", params.cusAdd);
  formData.append("product_name", params.productName);
  formData.append("product_category", params.productCategory);
  formData.append("product_profile", params.productProfile);

  const res = await fetch(`${baseUrl()}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  return (await res.json()) as SslcInitResponse;
}

export interface SslcValidateParams {
  valId: string;
}

export interface SslcValidateResponse {
  status: "VALID" | "VALIDATED" | "FAILED";
  error_reason?: string;
  tran_id?: string;
  amount?: string;
  currency?: string;
  card_issuer?: string;
}

/**
 * Validate an SSLCommerz payment transaction using val_id.
 */
export async function validatePayment(
  params: SslcValidateParams
): Promise<SslcValidateResponse> {
  const query = new URLSearchParams({
    val_id: params.valId,
    store_id: env.SSLC_STORE_ID,
    store_passwd: env.SSLC_STORE_PASSWORD,
    v: "1",
    format: "json",
  });

  const res = await fetch(
    `${baseUrl()}/validator/api/validationserverAPI.php?${query.toString()}`,
    { method: "GET" }
  );

  return (await res.json()) as SslcValidateResponse;
}

/**
 * Query transaction status by transaction ID.
 */
export async function queryByTransactionId(
  tranId: string
): Promise<Record<string, any>> {
  const query = new URLSearchParams({
    tran_id: tranId,
    store_id: env.SSLC_STORE_ID,
    store_passwd: env.SSLC_STORE_PASSWORD,
  });

  const res = await fetch(
    `${baseUrl()}/validator/api/merchantTransIDvalidationAPI.php?${query.toString()}`,
    { method: "GET" }
  );

  return (await res.json()) as Record<string, any>;
}

/**
 * Verify the SSLCommerz IPN hash to confirm authenticity.
 * SSLCommerz sends a `verify_hash` and `verify_key` in the IPN POST body.
 */
export function verifyIpnHash(
  postData: Record<string, string>,
  storePassword: string
): boolean {
  const key = postData["verify_key"];
  if (!key) return false;

  const keys = key.split(",").sort();
  const values = keys.map((k) => postData[k] ?? "");
  values.push(storePassword);

  const hash = values.join("|");

  const crypto = require("crypto");
  const computed = crypto.createHash("sha256").update(hash).digest("hex");
  const given = postData["verify_hash"]?.toLowerCase() ?? "";

  return computed === given;
}