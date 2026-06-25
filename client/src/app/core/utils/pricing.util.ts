/**
 * Client-side mirror of the server's extras pricing rules
 * (`Yummi.server/src/utils/extrasPricing.ts`). Used to preview cart line
 * totals before an order is placed. The server remains the source of truth.
 */

/**
 * Add-on charge for a single unit of a product.
 * The first `freeExtrasCount` selected extras are free; each additional one
 * costs `pricePerExtra`.
 */
export function computeExtrasChargePerUnit(
  selectedExtrasCount: number,
  freeExtrasCount: number,
  pricePerExtra: number,
): number {
  const paidCount = Math.max(0, selectedExtrasCount - freeExtrasCount);
  return parseFloat((paidCount * pricePerExtra).toFixed(2));
}

/**
 * Line total for one cart item: (base price + extras charge per unit) × quantity.
 */
export function computeLineTotal(
  basePrice: number,
  selectedExtrasCount: number,
  quantity: number,
  freeExtrasCount: number,
  pricePerExtra: number,
): number {
  const unitTotal =
    basePrice + computeExtrasChargePerUnit(selectedExtrasCount, freeExtrasCount, pricePerExtra);
  return parseFloat((unitTotal * quantity).toFixed(2));
}
