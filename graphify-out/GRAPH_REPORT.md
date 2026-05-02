# Graph Report - prd_eiger.md  (2026-05-02)

## Corpus Check
- Corpus is ~5,140 words - fits in a single context window. You may not need a graph.

## Summary
- 32 nodes · 33 edges · 6 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_E-Wallet & Payments Core|E-Wallet & Payments Core]]
- [[_COMMUNITY_Product Catalog & Transactions|Product Catalog & Transactions]]
- [[_COMMUNITY_IoT Gate Events|IoT Gate Events]]
- [[_COMMUNITY_Member API|Member API]]
- [[_COMMUNITY_Auth Architecture|Auth Architecture]]
- [[_COMMUNITY_Admin RBAC|Admin RBAC]]

## God Nodes (most connected - your core abstractions)
1. `products` - 5 edges
2. `transactions` - 5 edges
3. `EventsGateway` - 5 edges
4. `users` - 4 edges
5. `member` - 4 edges
6. `Atomic Checkout` - 4 edges
7. `wallets` - 3 edges
8. `payment_methods` - 3 edges
9. `sessions` - 2 edges
10. `memberships` - 2 edges

## Surprising Connections (you probably didn't know these)
- `users` --has--> `sessions`  [EXTRACTED]
  prd_eiger.md → prd_eiger.md  _Bridges community 0 → community 4_
- `users` --makes--> `transactions`  [EXTRACTED]
  prd_eiger.md → prd_eiger.md  _Bridges community 0 → community 1_
- `Checkout Flow` --emits_to--> `EventsGateway`  [EXTRACTED]
  prd_eiger.md → prd_eiger.md  _Bridges community 2 → community 0_

## Hyperedges (group relationships)
- **Member Authentication and Wallet** — prd_eiger_register_endpoint, prd_eiger_login_endpoint, prd_eiger_wallet_topup_endpoint, prd_eiger_users, prd_eiger_wallets, prd_eiger_memberships [EXTRACTED 1.00]
- **Checkout and Payment Flow** — prd_eiger_checkout_endpoint, prd_eiger_checkout_flow, prd_eiger_atomic_checkout, prd_eiger_wallets, prd_eiger_transactions, prd_eiger_payment_methods, prd_eiger_products [EXTRACTED 1.00]
- **IoT Gate Trigger Flow** — prd_eiger_dynamic_qr_code, prd_eiger_gate_open_event, prd_eiger_events_gateway, prd_eiger_transactions [EXTRACTED 1.00]
- **Ticket Product Catalog** — prd_eiger_base_entrance_pass, prd_eiger_premium_ride_addons, prd_eiger_all_access_bundling, prd_eiger_products [EXTRACTED 1.00]
- **Payment Method Paths** — prd_eiger_external_payment, prd_eiger_internal_ewallet, prd_eiger_payment_methods [EXTRACTED 1.00]

## Communities

### Community 0 - "E-Wallet & Payments Core"
Cohesion: 0.29
Nodes (8): Atomic Checkout, Checkout Flow, External Payment Gateway, Internal E-Wallet EAL, memberships, payment_methods, users, wallets

### Community 1 - "Product Catalog & Transactions"
Cohesion: 0.33
Nodes (7): All-Access Bundling, Base Entrance Pass, PnL Reporting, Premium Ride Add-ons, products, transaction_items, transactions

### Community 2 - "IoT Gate Events"
Cohesion: 0.33
Nodes (6): Dynamic QR Code, EventsGateway, gate_close, gate_open, quota_exceeded, ticket_scanned

### Community 3 - "Member API"
Cohesion: 0.4
Nodes (5): POST /transactions/checkout, POST /auth/login, member, POST /auth/register, POST /wallet/topup

### Community 4 - "Auth Architecture"
Cohesion: 0.67
Nodes (3): AuthGuard, Custom Session Auth, sessions

### Community 5 - "Admin RBAC"
Cohesion: 0.67
Nodes (3): Admin Products CRUD, admin, RolesGuard

## Knowledge Gaps
- **15 isolated node(s):** `AuthGuard`, `RolesGuard`, `gate_close`, `ticket_scanned`, `quota_exceeded` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `transactions` connect `Product Catalog & Transactions` to `E-Wallet & Payments Core`?**
  _High betweenness centrality (0.299) - this node is a cross-community bridge._
- **Why does `Atomic Checkout` connect `E-Wallet & Payments Core` to `Product Catalog & Transactions`?**
  _High betweenness centrality (0.260) - this node is a cross-community bridge._
- **Why does `Checkout Flow` connect `E-Wallet & Payments Core` to `IoT Gate Events`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **What connects `AuthGuard`, `RolesGuard`, `gate_close` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._