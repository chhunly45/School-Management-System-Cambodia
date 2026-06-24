import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Phone, MessageCircle, ShieldCheck, ArrowUpRight, AlertTriangle, MapPin, CalendarDays, Heart } from 'lucide-react';
import { getProductById, getProductBySlug, getProducts, trackProductView, updateProduct, deleteProduct } from '../services/product.api';
import { getProductCoverImageUrl } from '../utils/product';
import { formatViewsCount } from '../utils/views';
import { getProfile } from '../services/auth.api';
import { checkFavorite, addFavorite, removeFavorite } from '../services/favorites.api';
import { createReport } from '../services/report.api';
import { createChat } from '../services/chat.api';
import { formatPriceKHR, formatPriceUSD } from '../utils/price';
import { useAuth } from '../hooks/useAuth';
import SellerContactCard from '../components/marketplace/SellerContactCard';
import SEO from '../components/SEO';
import ProductCard from '../components/marketplace/ProductCard';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTargetType, setReportTargetType] = useState<'product' | 'user'>('product');
  const [reportReason, setReportReason] = useState<'scam' | 'fake_product' | 'duplicate_listing' | 'wrong_category' | 'other' | ''>('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [chatStatus, setChatStatus] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const getUserId = (user: any) => user?._id || user?.id || user?.userId;
  const getProductSellerId = (product: any) => product?.seller?._id || product?.seller?.id || product?.seller;

  const hasTrackedView = (productId: string) => {
    if (typeof window === 'undefined' || !productId) return false;
    try {
      const stored = JSON.parse(window.localStorage.getItem('viewedProducts') || '{}');
      return Boolean(stored[productId]);
    } catch {
      return false;
    }
  };

  const markViewTracked = (productId: string) => {
    if (typeof window === 'undefined' || !productId) return;
    try {
      const stored = JSON.parse(window.localStorage.getItem('viewedProducts') || '{}');
      stored[productId] = Date.now();
      window.localStorage.setItem('viewedProducts', JSON.stringify(stored));
    } catch {
      // ignore storage failures
    }
  };

  const isOwner = useMemo(() => {
    const currentUserId = getUserId(currentUser);
    const sellerId = getProductSellerId(product);
    const emailMatch = currentUser?.email && product?.seller?.email && currentUser.email.toLowerCase() === product.seller.email.toLowerCase();
    return (
      Boolean(currentUserId && sellerId && String(currentUserId) === String(sellerId)) ||
      Boolean(emailMatch)
    );
  }, [currentUser, product]);

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) return;
      setStatus('Loading product details...');
      try {
        const data = await getProductBySlug(slug as string);
        setProduct(data);
        setSelectedImage(getProductCoverImageUrl(data, ''));
        setIsFavorite(false);

        if (isAuthenticated) {
          try {
            const favorite = await checkFavorite(data._id);
            setIsFavorite(Boolean(favorite));
          } catch {
            setIsFavorite(false);
          }
        }

        setStatus('');
        try {
          const profile = await getProfile();
          setCurrentUser(profile);
        } catch {
          setCurrentUser(null);
        }
      } catch (error) {
        setStatus('Unable to load product.');
      }
    };
    loadProduct();
  }, [slug, isAuthenticated]);

  useEffect(() => {
    const trackView = async () => {
      if (!product?._id || hasTrackedView(product._id)) return;
      try {
        const result = await trackProductView(product._id);
        if (result?.viewsCount != null) {
          setProduct((current: any) => current ? { ...current, viewsCount: result.viewsCount } : current);
        }
        markViewTracked(product._id);
      } catch (error) {
        console.error('Unable to track product view:', error);
      }
    };
    trackView();
  }, [product]);

  useEffect(() => {
    const loadRelated = async () => {
      if (!product?.category?._id) return;
      setRelatedLoading(true);
      try {
        const response = await getProducts({ category: product.category._id, perPage: '8', sort: 'newest' });
        let items = response.items || [];
        items = items.filter((item: any) => item._id !== product._id && item.status !== 'sold');
        const shuffled = items.sort(() => Math.random() - 0.5);
        setRelatedProducts(shuffled.slice(0, 8));
      } catch (error) {
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };
    loadRelated();
  }, [product]);

  const formatPrice = (price: number | string) => {
    return {
      usd: formatPriceUSD(price),
      khr: formatPriceKHR(price)
    };
  };

  const getSeoDescription = (product: any) => {
    if (!product) return 'Find great local products on Konpuk.';

    // Use bilingual title if available, otherwise fallback to title
    const displayTitle = (product.titleKh && product.titleEn) 
      ? `${product.titleKh} / ${product.titleEn}` 
      : product.titleEn || product.titleKh || product.title;

    const base = `${displayTitle} in ${product.location || 'Cambodia'} under ${product.category?.labelKh || product.category?.name || 'General'} priced at ${formatPrice(product.price).usd}.`;
    const descriptionText = `${base} ${product.description ? product.description.trim() : ''}`.replace(/\s+/g, ' ').trim();
    const maxLength = 160;
    if (descriptionText.length <= maxLength) return descriptionText;
    return `${descriptionText.slice(0, maxLength - 3).trimEnd()}...`;
  };

  const safelyPhone = (value?: string) => {
    if (!value) return '';
    return value.replace(/[^0-9+]/g, '');
  };

  const reportProduct = async () => {
    if (!product) return;
    const reason = reportReason || 'other';
    try {
      await createReport({
        targetType: reportTargetType,
        targetId: reportTargetType === 'product' ? product._id : product.seller?._id,
        reason,
        details: reportMessage || `Please review this listing: ${displayTitle}`
      });
      setReportSuccess('Your report has been submitted and will be reviewed by our team.');
      setReportOpen(false);
      setReportReason('');
      setReportMessage('');
    } catch (error) {
      setReportSuccess('Unable to submit the report. Please try again.');
    }
  };

  const startChatWithSeller = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate(`/login?redirectTo=/products/${product.slug || product._id}`);
      return;
    }

    try {
      setChatStatus('Starting conversation...');
      const response = await createChat(product._id);
      const chatId = response?.chat?._id || response?.chat?.id;
      if (chatId) {
        navigate(`/messages/${chatId}`);
      } else {
        setChatStatus('Unable to open chat. Please try again.');
      }
    } catch (error: any) {
      setChatStatus(error?.response?.data?.message || error?.message || 'Unable to start chat.');
    }
  };

  if (!product) {
    return <div className="p-8 text-center text-text-secondary">{status || 'Loading product details...'}</div>;
  }

  const sellerPhone = safelyPhone(product.seller?.phoneNumber);
  const whatsappLink = sellerPhone ? `https://wa.me/${sellerPhone.replace(/^\+/, '')}` : null;
  const emailLink = product.seller?.email ? `mailto:${product.seller.email}?subject=Question%20about%20${encodeURIComponent(product.titleEn || product.titleKh || product.title)}` : null;
  const sellerJoined = product.seller?.createdAt ? new Date(product.seller.createdAt).toLocaleDateString() : null;

  // Seller details available in `product.seller` (no debug logging in production)

  // Build bilingual title for display and SEO
  const displayTitle = (product.titleKh && product.titleEn) 
    ? `${product.titleKh} / ${product.titleEn}` 
    : product.titleEn || product.titleKh || product.title;
  
  const seoTitle = `${displayTitle} for Sale in ${product.location || 'Cambodia'}`;
  const seoDescription = getSeoDescription(product);
  const canonicalUrl = `${window.location.origin}/products/${product.slug || product._id}`;
  const seoImage = getProductCoverImageUrl(product, '/no-image.png');
  const robotsTag = product.status === 'deleted' ? 'noindex' : 'index, follow';

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        url={canonicalUrl}
        image={seoImage}
        type="product"
        robots={robotsTag}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: displayTitle,
          image: [seoImage],
          description: product.description,
          sku: product._id,
          brand: {
            '@type': 'Brand',
            name: product.category?.labelKh || product.category?.name || 'Konpuk'
          },
          offers: {
            '@type': 'Offer',
            url: canonicalUrl,
            priceCurrency: product.currency || 'KHR',
            price: product.price,
            availability: product.status === 'published' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
          },
          seller: product.seller
            ? {
                '@type': product.seller?.companyName ? 'Organization' : 'Person',
                name: product.seller?.companyName || product.seller?.displayName || product.seller?.name || product.seller?.email || 'Konpuk Seller',
                url: product.seller?.profileUrl || undefined
              }
            : undefined
        }}
      />

      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border sm:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">Product detail</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold text-text-primary">{displayTitle}</h1>
                  {(product.featured || product.isFeatured) && (
                    <span className="rounded-full bg-amber-400 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-white shadow">Featured</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                      if (!product?._id) return;
                      try {
                        if (isFavorite) {
                          await removeFavorite(product._id);
                          setIsFavorite(false);
                        } else {
                          await addFavorite(product._id);
                          setIsFavorite(true);
                        }
                      } catch (err) {
                        console.error('Favorite toggle failed:', err);
                      }
                    }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${isFavorite ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-background text-text-primary hover:bg-background'}`}
                >
                  <Heart className="w-4 h-4" />
                  {isFavorite ? 'Saved' : 'Save'}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                <span>{product.category?.labelKh || product.category?.name || 'General'}</span>
                <span className="h-1 w-1 rounded-full bg-background" />
                <span>{product.location || 'Local'}</span>
                <span className="h-1 w-1 rounded-full bg-background" />
                <span>{product.condition || 'Condition not specified'}</span>
                <span className="h-1 w-1 rounded-full bg-background" />
                <span>{formatViewsCount(product.viewsCount)} views</span>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 rounded-3xl bg-background px-5 py-4 text-left sm:text-right">
              <span className="text-sm text-muted">Price</span>
              <span className="text-3xl font-semibold text-primary">{formatPrice(product.price).usd}</span>
              <span className="text-sm text-muted">{formatPrice(product.price).khr}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-text-secondary">
                {product.status === 'sold' ? 'Sold' : 'Available'}
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(360px,0.5fr)_minmax(480px,0.7fr)]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2rem] bg-background shadow-sm">
                <img
                  src={selectedImage || getProductCoverImageUrl(product, '/no-image.png')}
                  alt={displayTitle}
                  className="h-96 w-full object-cover"
                />
              </div>

              {product.images && product.images.length > 1 && (
                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4">
                  {product.images.map((image: any) => {
                    const src = image.secureUrl || image.url;
                    return (
                      <button
                        key={image._id}
                        type="button"
                        onClick={() => setSelectedImage(src)}
                        className={`overflow-hidden rounded-3xl border ${selectedImage === src ? 'border-primary' : 'border-transparent'} bg-white focus:outline-none focus:ring-2 focus:ring-primary/30`}
                      >
                        <img src={src} alt={displayTitle} className="h-24 w-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="rounded-[2rem] bg-background p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.35em] text-muted">Quick details</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-muted">Category</p>
                    <p className="mt-2 text-sm font-semibold text-text-primary">{product.category?.labelKh || product.category?.name || 'General'}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-muted">Location</p>
                    <p className="mt-2 text-sm font-semibold text-text-primary">{product.location || 'Not specified'}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-muted">Condition</p>
                    <p className="mt-2 text-sm font-semibold text-text-primary">{product.condition || 'N/A'}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-muted">Listed</p>
                    <p className="mt-2 text-sm font-semibold text-text-primary">{new Date(product.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] bg-background p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-text-primary">Product overview</h2>
                <p className="mt-4 text-sm leading-7 text-text-secondary">{product.description}</p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.35em] text-muted">Seller information</p>
                        <h3 className="mt-3 text-xl font-semibold text-text-primary inline-flex items-center gap-2">
                          {product.seller?.displayName || 'Seller'}
                        </h3>
                      </div>
                      {product.seller?.sellerVerificationStatus === 'verified' ? (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                          <ShieldCheck className="w-4 h-4" /> ✓ Verified Seller
                        </div>
                      ) : product.seller?.sellerVerificationStatus === 'unverified' ? (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">
                          Unverified Seller
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="h-16 w-16 overflow-hidden rounded-3xl bg-background">
                    {product.seller?.profileImageUrl ? (
                      <img src={product.seller.profileImageUrl} alt={product.seller.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted">No Image</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm text-text-secondary">
                  {product.seller?.location && (
                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted" /> {product.seller.location}</p>
                  )}
                  {sellerJoined && (
                    <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted" /> Joined {sellerJoined}</p>
                  )}
                  {product.seller?.email && (
                    <p className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-muted" /> {product.seller.email}</p>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  {!isOwner && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={startChatWithSeller}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message seller
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.open(`mailto:${product.seller?.email}?subject=${encodeURIComponent(`Question about ${displayTitle}`)}`, '_blank');
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-muted bg-white px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-background transition"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        Email seller
                      </button>
                    </div>
                  )}
                  <SellerContactCard 
                    sellerName={product.seller?.displayName}
                    sellerPhone={sellerPhone}
                    sellerEmail={product.seller?.email}
                    telegramHandle={product.seller?.telegramHandle}
                  />
                  {chatStatus && (
                    <div className="rounded-3xl bg-primary/10 p-4 text-sm text-primary">
                      {chatStatus}
                    </div>
                  )}
                  {/* Owner controls */}
                  {isOwner && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/post-product?id=${product._id}`)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-muted bg-white px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-background transition"
                      >
                        Edit Product
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm('Are you sure you want to delete this product?')) return;
                          try {
                            await deleteProduct(product._id);
                            navigate('/dashboard');
                          } catch (err) {
                            alert('Unable to delete product.');
                          }
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
                      >
                        Delete Product
                      </button>
                      {product.status !== 'sold' && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await updateProduct(product._id, { status: 'sold' });
                              setStatus('Product marked as sold.');
                              setProduct({ ...product, status: 'sold' });
                            } catch (err) {
                              setStatus('Could not update product status.');
                            }
                          }}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-text-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition"
                        >
                          Mark as Sold
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReportTargetType('product');
                        setReportOpen(!reportOpen);
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
                    >
                      <AlertTriangle className="w-4 h-4" /> Report listing
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportTargetType('user');
                        setReportOpen(!reportOpen);
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition"
                    >
                      <ShieldCheck className="w-4 h-4" /> Report seller
                    </button>
                  </div>
                </div>

                {reportOpen && (
                  <div className="mt-5 rounded-3xl border border-muted bg-background p-4">
                    <p className="text-sm font-semibold text-text-secondary">Report this {reportTargetType === 'product' ? 'listing' : 'seller'}</p>
                    <div className="mt-3 space-y-4">
                      <label className="block text-sm text-text-secondary">
                        Reason
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value as 'scam' | 'fake_product' | 'duplicate_listing' | 'wrong_category' | 'other' | '')}
                          className="mt-2 w-full rounded-2xl border border-muted bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                        >
                          <option value="">Select reason</option>
                          <option value="scam">Scam</option>
                          <option value="fake_product">Fake product</option>
                          <option value="duplicate_listing">Duplicate listing</option>
                          <option value="wrong_category">Wrong category</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                      <label className="block text-sm text-text-secondary">
                        Message
                        <textarea
                          value={reportMessage}
                          onChange={(e) => setReportMessage(e.target.value)}
                          rows={3}
                          placeholder="Add any additional details"
                          className="mt-2 w-full rounded-2xl border border-muted bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={reportProduct}
                        className="rounded-3xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 transition"
                      >
                        Submit report
                      </button>
                    </div>
                  </div>
                )}

                {reportSuccess && (
                  <div className="mt-4 rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-700">
                    {reportSuccess}
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] bg-background p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-text-primary">Safety tips for buyers</h2>
                <ul className="mt-4 space-y-3 text-sm text-text-secondary">
                  <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary" /> Meet in a safe public place.</li>
                  <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary" /> Verify the product before paying.</li>
                  <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary" /> Use trusted payment methods where possible.</li>
                  <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary" /> Keep conversation on the platform or email for proof.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {(relatedLoading || relatedProducts.length > 0 || (!relatedLoading && product?.category?._id)) && (
          <div className="mt-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-muted">Similar Products</p>
                <h2 className="text-2xl font-semibold text-text-primary">You might also like</h2>
              </div>
              <Link to="/products" className="text-sm font-semibold text-primary hover:text-primary">Browse all</Link>
            </div>

            <div className="mt-6">
              {relatedLoading ? (
                <div className="rounded-[2rem] border border-muted bg-background p-8 text-center text-text-secondary">
                  Loading similar products...
                </div>
              ) : relatedProducts.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {relatedProducts.map((item) => (
                    <ProductCard
                      key={item._id}
                      id={item._id}
                      title={item.title}
                      titleKh={item.titleKh}
                      titleEn={item.titleEn}
                      price={item.price}
                      location={item.location || 'Unknown'}
                      category={item.category?.labelKh || item.category?.name || 'General'}
                      imageUrl={item.images?.[0]?.secureUrl || item.images?.[0]?.url || item.imageUrl || ''}
                      seller={item.seller}
                      featured={item.featured || item.isFeatured}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-muted bg-background p-8 text-center text-text-secondary">
                  No similar products were found in this category.
                </div>
              )}
            </div>
          </div>
        )}

        {status && <p className="mt-6 text-sm text-text-secondary">{status}</p>}
      </div>
    </>
  );
};

export default ProductDetailPage;


