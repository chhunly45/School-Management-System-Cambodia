import SEO from '../components/SEO';
import { Link } from 'react-router-dom';

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-background py-10 sm:py-16">
      <SEO
        title="Help Center | Konpuk"
        description="Find answers for account setup, product posting, image management, safety tips, and customer support on Konpuk."
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-primary">Help Center</p>
          <h1 className="mt-4 text-4xl font-semibold text-text-primary sm:text-5xl">Need help? We’re here for you.</h1>
          <p className="mt-4 max-w-3xl mx-auto text-base leading-8 text-text-secondary sm:text-lg">
            Learn how to manage your account, post and edit listings, stay safe while buying and selling, and contact support.
          </p>
        </div>

        <div className="space-y-10">
          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">1. Account</h2>
            <div className="mt-6 space-y-6 text-base leading-8 text-text-secondary">
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Registration</h3>
                <p className="mt-2">
                  Create a Konpuk account with your email, phone number, and password. A verified account helps build trust with buyers and sellers.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Login</h3>
                <p className="mt-2">
                  Use your registered email or phone number and password to log in. If you forget your password, use the Forgot Password page to reset it.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Account management</h3>
                <p className="mt-2">
                  Update your profile, change your password, and manage your personal details from the account settings page.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">2. Products</h2>
            <div className="mt-6 space-y-6 text-base leading-8 text-text-secondary">
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Post product</h3>
                <p className="mt-2">
                  Start a new listing by adding a clear title, category, price, location, and description. Upload good photos to attract buyers.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Edit product</h3>
                <p className="mt-2">
                  Edit your listing anytime to update the price, description, or product details. Keep your listing accurate so buyers know what to expect.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Upload images</h3>
                <p className="mt-2">
                  Add multiple images to show your item from different angles. Good photos increase buyer confidence and improve your listing.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Delete images</h3>
                <p className="mt-2">
                  Remove photos you no longer want in your listing. Use the delete button on each image to keep your gallery clean and up to date.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Set cover image</h3>
                <p className="mt-2">
                  Choose the best image to show first in search results and listing previews. Set your cover image on the product edit page.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">3. Safety</h2>
            <div className="mt-6 space-y-6 text-base leading-8 text-text-secondary">
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Safe buying tips</h3>
                <p className="mt-2">
                  Meet sellers in a public place, confirm item condition before paying, and keep communication records on Konpuk.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Safe selling tips</h3>
                <p className="mt-2">
                  Describe your item honestly, respond quickly to buyer questions, and arrange safe pickup methods.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Scam prevention</h3>
                <p className="mt-2">
                  Avoid requests for unusual payment methods, verify buyer and seller details, and never share personal or banking information.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">4. Contact support</h2>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              If you need further assistance, our support team is available to help with account issues, listing problems, or safety concerns.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-3xl bg-surface p-6">
                <p className="text-sm font-semibold text-text-primary">Email</p>
                <p className="mt-2 text-base text-text-secondary">support@konpuk.com</p>
              </div>
              <div className="rounded-3xl bg-surface p-6">
                <p className="text-sm font-semibold text-text-primary">Phone</p>
                <p className="mt-2 text-base text-text-secondary">+855 (0) 89 229 971</p>
              </div>
              <div className="rounded-3xl bg-surface p-6">
                <p className="text-sm font-semibold text-text-primary">Need help now?</p>
                <p className="mt-2 text-base text-text-secondary">Visit our support center or send us a message through your account.</p>
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

export default HelpPage;
