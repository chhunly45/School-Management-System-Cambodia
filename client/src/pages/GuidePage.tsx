import SEO from '../components/SEO';
import { Link } from 'react-router-dom';

const GuidePage = () => {
  return (
    <div className="min-h-screen bg-background py-10 sm:py-16">
      <SEO
        title="Guide to Konpuk"
        description="Step-by-step guide to posting products, browsing listings, and staying safe on Konpuk."
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-primary">Konpuk Guide</p>
          <h1 className="mt-4 text-4xl font-semibold text-text-primary sm:text-5xl">How to use Konpuk</h1>
          <p className="mt-4 max-w-3xl mx-auto text-base leading-8 text-text-secondary sm:text-lg">
            Follow these tips to get the most from Konpuk for buying, selling, and managing your listings.
          </p>
        </div>

        <div className="space-y-12">
          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">Browse listings</h2>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              Use search, category filters, and location to find products that match your needs. Tap any listing to see details, seller information, and contact options.
            </p>
            <ul className="mt-4 space-y-3 text-base leading-8 text-text-secondary list-disc list-inside">
              <li>Search by keywords like brand, model, or item type.</li>
              <li>Filter by category or location to narrow results.</li>
              <li>View product images, descriptions, and seller ratings before you contact the seller.</li>
            </ul>
          </section>

          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">Post a product</h2>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              Create a new listing quickly by providing clear photos, a descriptive title, accurate price, and a detailed description.
            </p>
            <div className="mt-4 space-y-4 text-base leading-8 text-text-secondary">
              <div>
                <p className="font-semibold text-text-primary">Step 1: Add photos</p>
                <p>Select high-quality images that show the item’s condition clearly. You can upload multiple photos and choose a cover image for your listing.</p>
              </div>
              <div>
                <p className="font-semibold text-text-primary">Step 2: Complete the details</p>
                <p>Fill in the title, category, price, location, and product condition. The more details you provide, the easier it is for buyers to find your item.</p>
              </div>
              <div>
                <p className="font-semibold text-text-primary">Step 3: Publish</p>
                <p>Review your listing, then publish it. Your product will appear in Konpuk search results and category listings.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">Manage your listings</h2>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              Edit listings whenever you want to update the price, add new images, or change the description.
            </p>
            <ul className="mt-4 space-y-3 text-base leading-8 text-text-secondary list-disc list-inside">
              <li>Use the edit page to remove or replace photos quickly.</li>
              <li>Select a cover image for your listing so buyers see the best photo first.</li>
              <li>Keep your listing status up to date and mark sold items when appropriate.</li>
            </ul>
          </section>

          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">Contact the seller</h2>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              When you find an item you like, use Konpuk’s contact options to ask questions and arrange the purchase.
            </p>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              Always confirm the item condition and payment plan before finalizing the sale.
            </p>
          </section>

          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">Useful resources</h2>
            <div className="mt-4 space-y-4 text-base leading-8 text-text-secondary">
              <div>
                <p className="font-semibold text-text-primary">Need more help?</p>
                <p>Visit the About page for contact details and support information.</p>
              </div>
              <div>
                <p className="font-semibold text-text-primary">Want to browse categories?</p>
                <p>Start from the homepage and explore popular categories to find fresh listings fast.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link to="/" className="inline-flex items-center justify-center rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover">
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuidePage;
