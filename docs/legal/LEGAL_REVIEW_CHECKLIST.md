# NUDOS Colombia legal review checklist

Status: preparation document, not legal advice and not legal approval.

Counsel should review the deployed product, token policy, actual users, legal
entity, contracts, jurisdictions, and data flows before public mainnet launch.

## Token and product

- Confirm the NUDOS utility description matches actual functionality and does
  not promise appreciation, yield, guaranteed return, redemption into money, or
  regulated financial services.
- Classify issuance, founder vesting, rewards, marketplace use, treasury
  replenishment, custody, and any exchange or transfer service.
- Determine whether the operating entity falls within Colombian virtual-asset
  service-provider reporting or AML/CFT obligations.
- Review consumer information, pricing, fees, reversals, complaints, minors,
  warranties, digital-service terms, and marketing claims.
- Confirm tax/accounting treatment of token issuance, rewards, treasury
  movements, and founder allocation.

## Privacy and data

- Identify the legal entity acting as data controller and each processor.
- Inventory profile, wallet, university, recycling, marketplace, credential,
  Supabase Auth, log, analytics, and blockchain data.
- Document purposes, legal bases/authorizations, retention, recipients,
  international transfers/transmissions, and deletion limitations for public
  blockchain records.
- Provide the controller identity/contact, data-subject rights, consultation
  and complaint procedure, effective date, and material-change mechanism.
- Ensure consent is prior, express, informed, provable, and separate where
  sensitive data or minors are involved.
- Reconcile deletion/rectification rights with immutable hashes: keep personal
  data offchain and anchor only non-identifying commitments where possible.
- Review Supabase, Vercel, wallet, RPC, email, analytics, and other subprocessors
  plus their data locations and contractual terms.

## Documents and acceptance

- Terms of service approved by counsel and the operating entity.
- Privacy and personal-data treatment policy approved and published.
- Just-in-time notices and consent records implemented in relevant flows.
- Token risk disclosure and fee schedule published.
- Complaint, privacy-request, and security-report channels tested.
- Versioned acceptance records retained with document version and timestamp.

## Sources for counsel to confirm

- Colombian personal-data framework: Ley 1581 de 2012 and Decreto 1074 de
  2015, summarized by the SIC at
  <https://sedeelectronica.sic.gov.co/politica-de-tratamiento-de-datos-personales>.
- Consumer protection: Ley 1480 de 2011 at
  <https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306>.
- Current SFC position on virtual assets:
  <https://www.superfinanciera.gov.co/publicaciones/10103299/innovasfcelhub-10103299/>.
- UIAF virtual-asset information and reporting materials:
  <https://uiaf.gov.co/sector/activos-virtuales>.

`legal.tokenAndPrivacyReviewApproved` and `legal.termsAndPrivacyPublished` must
remain false until qualified review and publication are evidenced.
