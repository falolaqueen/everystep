This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Custom footwear orders (new)

1. In the Supabase project used by this deployment, open **SQL Editor** and run `supabase/migrations/202611040001_custom_design_orders.sql`. This creates the custom order, category pricing and materials tables, and the private `es-custom-designs` storage bucket.
2. Deploy the updated project. Keep the existing Supabase URL, publishable key and service-role key environment variables. AI category suggestions also use the existing `OPENAI_API_KEY`; optionally set `OPENAI_VISION_MODEL` (defaults to `gpt-4o-mini`).
3. Open `/admin/custom-orders`. Set a base price and labour fee for each footwear type, then add your materials and their per-pair costs. Mark unavailable materials and configure available alternatives.
4. Customers can submit requests at `/custom-order`, upload up to three reference photos and provide their WhatsApp number, size, quantity and specifications.
5. In Custom design orders, review each request, optionally ask AI to suggest the footwear type, select materials, calculate a quote or enter a manual quote, and message the customer through WhatsApp. The system will not generate an automatic quote when selected materials are unavailable or the category has no configured price.

AI classification is a suggestion only. The quote is calculated from the prices configured by the business and should be checked before sending.


## Custom footwear design orders
- Customers can open the custom design request from the prominent **Upload your preferred design** panel at the top of each product detail page, or from the shop page.
- The custom order form displays the standard footwear types immediately and refreshes them from Supabase. The category API safely seeds the default types if the migration's seed rows are missing.
- Admins manage categories and prices at `/admin/custom-orders`.
- Ensure the `202611040001_custom_design_orders.sql` migration has been run in the Supabase SQL Editor before accepting submissions.
