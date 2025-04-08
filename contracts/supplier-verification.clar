;; Supplier Verification Contract
;; This contract validates legitimate product manufacturers

(define-data-var contract-owner principal tx-sender)

;; Map of verified suppliers: principal -> boolean
(define-map verified-suppliers principal bool)

;; Map of supplier details: principal -> details
(define-map supplier-details
  principal
  {
    name: (string-utf8 100),
    registration-number: (string-utf8 50),
    country: (string-utf8 50),
    verification-date: uint,
    verifier: principal
  }
)

;; Public function to verify a supplier
(define-public (verify-supplier
    (supplier principal)
    (name (string-utf8 100))
    (registration-number (string-utf8 50))
    (country (string-utf8 50))
  )
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1)) ;; Only owner can verify
    (map-set verified-suppliers supplier true)
    (map-set supplier-details supplier {
      name: name,
      registration-number: registration-number,
      country: country,
      verification-date: block-height,
      verifier: tx-sender
    })
    (ok true)
  )
)

;; Public function to revoke verification
(define-public (revoke-verification (supplier principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1)) ;; Only owner can revoke
    (map-delete verified-suppliers supplier)
    (map-delete supplier-details supplier)
    (ok true)
  )
)

;; Read-only function to check if a supplier is verified
(define-read-only (is-verified (supplier principal))
  (default-to false (map-get? verified-suppliers supplier))
)

;; Read-only function to get supplier details
(define-read-only (get-supplier-details (supplier principal))
  (map-get? supplier-details supplier)
)

;; Function to transfer ownership
(define-public (transfer-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1))
    (var-set contract-owner new-owner)
    (ok true)
  )
)
