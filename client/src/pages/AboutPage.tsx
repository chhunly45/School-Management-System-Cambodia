import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background py-10 sm:py-16">
      <SEO
        title="About Konpuk"
        description="Learn what Konpuk is, our mission, why you should use Konpuk, safe buying and selling tips, and how to contact us."
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-primary">About Konpuk</p>
          <h1 className="mt-4 text-4xl font-semibold text-text-primary sm:text-5xl">Welcome to Konpuk</h1>
          <p className="mt-4 max-w-3xl mx-auto text-base leading-8 text-text-secondary sm:text-lg">
            Konpuk is Cambodia’s homegrown marketplace for buying and selling local goods safely and conveniently.
          </p>
        </div>

        <div className="space-y-12">
          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">What is Konpuk</h2>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              Konpuk is a trusted local platform for buyers and sellers across Cambodia. We connect people with the products they need, from electronics and vehicles to clothing and home goods.
            </p>
          </section>

          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">Mission</h2>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              Our mission is to make online buying and selling simple, fair, and safe for everyone in Cambodia. We help local sellers reach more customers and support buyers in finding quality products from trusted sellers.
            </p>
          </section>

          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">Why use Konpuk</h2>
            <ul className="mt-4 space-y-4 text-base leading-8 text-text-secondary list-disc list-inside">
              <li>Fast access to local products across Cambodia.</li>
              <li>Verified sellers and real listings to help you shop with confidence.</li>
              <li>Simple product posting and image upload workflow.</li>
              <li>Built-in messaging and notifications for buyer-seller communication.</li>
              <li>Responsive design for mobile users on the go.</li>
            </ul>
          </section>

          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">Safe buying and selling tips</h2>
            <div className="mt-4 space-y-4 text-base leading-8 text-text-secondary">
              <div>
                <p className="font-semibold text-text-primary">Confirm product details:</p>
                <p>Ask the seller about the condition, model, and any missing accessories before purchasing.</p>
              </div>
              <div>
                <p className="font-semibold text-text-primary">Meet in public:</p>
                <p>Choose a safe public meeting place to inspect the product and complete the transaction.</p>
              </div>
              <div>
                <p className="font-semibold text-text-primary">Use secure payment methods:</p>
                <p>Avoid sending money before you have verified the item and seller.</p>
              </div>
              <div>
                <p className="font-semibold text-text-primary">Keep communication on Konpuk:</p>
                <p>Use Konpuk messages to keep a record of your conversation and transaction details.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-surface-muted bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold text-text-primary">Contact information</h2>
            <p className="mt-4 text-base leading-8 text-text-secondary">
              If you have questions or need support, we’re here to help.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-surface p-6">
                <p className="text-sm font-semibold text-text-primary">Email</p>
                <p className="mt-2 text-base text-text-secondary">support@konpuk.com</p>
              </div>
              <div className="rounded-3xl bg-surface p-6">
                <p className="text-sm font-semibold text-text-primary">Phone</p>
                <p className="mt-2 text-base text-text-secondary">+855 (0) 89 229 971</p>
              </div>
              <div className="rounded-3xl bg-surface p-6">
                <p className="text-sm font-semibold text-text-primary">Address</p>
                <p className="mt-2 text-base text-text-secondary">Phnom Penh, Cambodia</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link to="/guide" className="inline-flex items-center justify-center rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover">
            Learn how to use Konpuk
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
