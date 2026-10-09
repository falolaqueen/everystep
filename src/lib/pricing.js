
export function getEffectivePrice(product, settings = {}) {
  const original = Math.max(0, Number(product?.price) || 0);
  const fixed = product?.sale_price;
  const ownPercent = product?.sale_percent;

  let final = original;
  let percent = 0;

  if (fixed !== null && fixed !== undefined && fixed !== "") {
    final = Math.min(
      original,
      Math.max(0, Number(fixed) || 0)
    );
  } else {
    percent =
      ownPercent !== null &&
      ownPercent !== undefined &&
      ownPercent !== ""
        ? Number(ownPercent)
        : settings.sale_enabled
          ? Number(settings.sale_percent || 0)
          : 0;

    percent = Math.max(0, Math.min(100, percent));

    final =
      Math.round(original * (1 - percent / 100) * 100) / 100;
  }

  return {
    original,
    final,
    savings: Math.round((original - final) * 100) / 100,
    percentOff:
      original > 0
        ? Math.round(((original - final) / original) * 100)
        : 0,
    onSale: final < original,
  };
}

export function productBelongsToSection(product, sectionId) {
  return (
    (Array.isArray(product?.section_ids) &&
      product.section_ids.includes(sectionId)) ||
    product?.section_id === sectionId
  );
}
