---
id: secure-web-db-endpoint-guard
name: "Secure Web & DB Endpoint Guard"
description: "Enforces Zero-Trust endpoint security, web attack mitigation, and prevents database-injection/second-order exploits during autonomous generation"
version: "1.0.0"
---

## Goal
To ensure that all generated web applications, API endpoints, and database connection architectures follow strict secure-by-default blueprints. This skill prevents the unintentional exposure of internal system endpoints and automatically inserts security patches against XSS, CSRF, SQLi, and Second-Order Stored Injection vulnerabilities.

## Instructions
When writing, refactoring, or auditing code, you MUST execute the following four multi-layered defensive guardrails:

### 1. Zero-Exposure Endpoint Masking
* **No Direct File-System or Database Mapping:** Never generate routing logic that maps URL parameters directly to internal files, database keys, or local functions (e.g., avoid `router.get('/api/' + user_input)`).
* **Opaque API Gateways:** Route internal microservices behind a unified, generic entry controller. Obfuscate all backend framework footprints (e.g., strip headers like `X-Powered-By`).
* **Strict Endpoint Validation:** Implement strict route allow-listing. If an incoming request does not explicitly match an allowed, pre-defined signature, immediately drop the request with a generic `404 Not Found` rather than a detailed error.

### 2. Immediate Web-Attack Shielding
* **Input Sanitization at the Boundary:** Every text input field from web requests must pass through an absolute sanitization layer (e.g., `bleach` in Python, `DOMPurify` in Node.js) before being processed.
* **XSS Neutralization:** Automatically apply strict HTML entity encoding to data rendered in UI views to prevent Cross-Site Scripting.
* **State Verification:** Force the generation of CSRF tokens for all state-changing HTTP requests (POST, PUT, DELETE) and require the `SameSite=Strict` and `Secure` attributes on all session cookies.

### 3. Secure Query Engines & Parameterization
* **Absolute Parameterization:** Never use string concatenation, string interpolation, or raw templates to build SQL or NoSQL queries. All user-supplied variables must be bound using strictly-typed parameterized queries or a secure ORM abstraction.
* **Query Interception:** If requested code involves database reads/writes, inject an automated middleware function that rejects strings containing standard attack payloads (such as `--`, `UNION`, `OR 1=1`) before they reach the driver.

### 4. Storage Security & Second-Order Attack Prevention
* **Context-Aware Output Encoding:** When data is fetched *out* of storage/database to be served to a client, it must be programmatically re-encoded based on its target context (e.g., text, JSON, HTML attributes). This guarantees that malicious payloads slipped into the database in the past cannot execute when read back.
* **Broken Object-Level Authorization (BOLA) Check:** For any query fetching individual records based on IDs (e.g., `/records?id=123`), force code that verifies if the requesting authenticated session token possesses clear ownership over that specific object ID.
