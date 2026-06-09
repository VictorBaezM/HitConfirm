# Secure Web & DB Endpoint Guard

Enforces Zero-Trust endpoint security, web attack mitigation, and prevents database-injection/second-order exploits during autonomous generation

## Goal

To ensure that all generated web applications, API endpoints, and database connection architectures follow strict secure-by-default blueprints. This skill prevents the unintentional exposure of internal system endpoints and automatically inserts security patches against XSS, CSRF, SQLi, and Second-Order Stored Injection vulnerabilities.

## Instructions

When writing, refactoring, or auditing code, you MUST execute the following four multi-layered defensive guardrails:

### 1. Zero-Exposure Endpoint Masking

* **No Direct File-System or Database Mapping:** Never generate routing logic that maps URL parameters directly to internal files, database keys, or local functions (e.g., avoid `router.get('/api/' + user_input)`).
* **Opaque API Gateways:** Route internal microservices behind a generic entry controller. Obfuscate all backend framework footprints.
* **Strict Endpoint Validation:** Implement strict route allow-listing. If an incoming request does not explicitly match an allowed, pre-defined signature, immediately drop the request with a generic `404 Not Found`.

### 2. Immediate Web-Attack Shielding

* **Input Sanitization at the Boundary:** Every text input field from web requests must pass through an absolute sanitization layer before being processed.
* **XSS Neutralization:** Automatically apply HTML entity encoding to data rendered in UI views.
* **State Verification:** Force CSRF tokens for all state-changing HTTP requests and require secure cookies.

### 3. Secure Query Engines & Parameterization

* **Absolute Parameterization:** Never use string concatenation or interpolation for queries. All user-supplied variables must be bound using parameterized queries or ORM.
* **Query Interception:** Reject strings containing SQL injection patterns before reaching the driver.

### 4. Storage Security & Second-Order Attack Prevention

* **Context-Aware Output Encoding:** Re-encode data fetched out of storage based on target context.
* **Broken Object-Level Authorization (BOLA) Check:** Verify session ownership over specific object IDs.
