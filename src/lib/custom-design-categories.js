
const SOLE_PREFERENCE_NAMES = new Set([
  "foreign soles",
  "nigerian soles",
]);

export async function ensureCustomDesignCategories(
  admin,
  { includeInactive = false } = {}
) {
  // Get categories from the main Admin Dashboard.
  const { data: sections, error: sectionsError } = await admin
    .from("sections")
    .select("name,is_active,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (sectionsError) throw sectionsError;

  // Get existing custom-order categories.
  const { data: existing, error: existingError } = await admin
    .from("es_custom_categories")
    .select(
      "id,name,nigeria_sole_price,foreign_sole_price,is_active,sort_order"
    );

  if (existingError) throw existingError;

  const existingByName = new Map(
    (existing || []).map((item) => [
      String(item.name || "").trim().toLowerCase(),
      item,
    ])
  );

  // Add newly created Dashboard categories without overwriting
  // existing custom category prices or Active settings.
  for (const [index, section] of (sections || []).entries()) {
    const name = String(section.name || "").trim();

    if (
      !name ||
      SOLE_PREFERENCE_NAMES.has(name.toLowerCase())
    ) {
      continue;
    }

    const key = name.toLowerCase();
    const existingCategory = existingByName.get(key);

    if (existingCategory) {
      // Keep the custom category's own Active setting.
      // Only synchronise its display name and sorting.
      const { error } = await admin
        .from("es_custom_categories")
        .update({
          name,
          sort_order: section.sort_order ?? index + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCategory.id);

      if (error) throw error;
    } else {
      const { data: inserted, error } = await admin
        .from("es_custom_categories")
        .insert({
          name,
          nigeria_sole_price: 0,
          foreign_sole_price: 0,
          is_active: section.is_active === true,
          sort_order: section.sort_order ?? index + 1,
        })
        .select(
          "id,name,nigeria_sole_price,foreign_sole_price,is_active,sort_order"
        )
        .single();

      if (error) throw error;

      if (inserted) {
        existingByName.set(key, inserted);
      }
    }
  }

  // Do not deactivate categories simply because they were created
  // from the Custom Orders page rather than the main Dashboard.

  let query = admin
    .from("es_custom_categories")
    .select(
      "id,name,nigeria_sole_price,foreign_sole_price,is_active,sort_order"
    );

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.order("sort_order", {
    ascending: true,
  });

  if (error) throw error;

  return data || [];
}