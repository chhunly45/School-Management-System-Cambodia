# Changelog

## [0.6.0] - 2026-07-15

### Finance Management

SMS-CAM v0.6.0 introduces a major upgrade to the finance module with a more professional, production-ready payment experience.

#### Added
- Redesigned payment entry workflow
- Searchable student lookup with auto-fill capabilities
- Fee breakdown support for future-ready finance extensions
- Payment summary and printable receipt experience
- PaymentReceipt component for polished receipt output
- Backward-compatible finance extension layer
- Payment form utilities and success dialog flow
- Regression tests covering finance UI and receipt rendering

#### Improved
- Payment entry is now more intuitive and aligned with school administration workflows
- Finance UI is now better suited for daily tuition and payment management
- Existing payment-related integrations remain compatible with the current API contract

#### Technical Notes
- Existing /payments API remains unchanged
- No breaking backend changes were introduced
- Backward compatibility was preserved throughout the release
- The finance extension layer is prepared for future fee types and richer reporting scenarios

#### Verification
- Production build verified successfully
- Relevant finance regression tests passed
