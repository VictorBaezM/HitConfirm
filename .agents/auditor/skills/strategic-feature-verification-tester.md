# Strategic Feature Verification Tester

Applies expert-level QA strategies to enforce robust feature verification. Mandates high-value, non-redundant testing (Unit, Integration, or E2E) tailored to the logic tier to maximize reliability without degrading execution performance.

### 1. Core Testing Philosophy

* **Focus on Behavior, Not Implementation:** Test what the code does, not how it does it.
* **The "Right Tool for the Job" Principle:** Match the test type to the risk profile of the code.
* **Zero Redundancy:** Avoid duplicate test logic between tiers.

### 2. Test Selection Framework

| Code Tier | Primary Testing Strategy | Core Objective | Avoid These Pitfalls |
| :--- | :--- | :--- | :--- |
| **Pure Logic & Utilities** | Focused Unit Tests | Validate computational logic, error handling, boundary values, and state changes quickly. | Mocking external systems unnecessarily; writing too many unit tests for simple things. |
| **Interconnected Modules** | Integration / API Tests | Verify contract adherence, proper data formatting, and correct integration. | Spinning up full UI or browser just for API check. |
| **User Workflows** | Targeted End-to-End (E2E) | Validate critical "happy paths" and high-risk user journeys. | E2E testing for styling/basic form validations. |

### 3. Execution Rules & Quality Guardrails

* **Enforce Test Isolation:** Every test must be completely self-contained.
* **Deterministic Execution:** No flaky tests.
* **Performance Conscious:** Assert execution times/resource bounds when appropriate.
