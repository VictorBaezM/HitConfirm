---
id: strategic-feature-verification-tester
name: "Strategic Feature Verification Tester"
description: "Applies expert-level QA strategies to enforce robust feature verification. Mandates high-value, non-redundant testing (Unit, Integration, or E2E) tailored to the logic tier to maximize reliability without degrading execution performance."
version: "1.0.0"
---

### 1. Core Testing Philosophy
You must approach testing through the lens of a seasoned Software Test Engineer. Your goal is maximum confidence with minimum bloat. 
* **Focus on Behavior, Not Implementation:** Test what the code *does*, not how it does it. This prevents tests from breaking during minor internal refactors.
* **The "Right Tool for the Job" Principle:** Do not default to heavy, slow tests when lightweight options exist. Match the test type to the risk profile of the code.
* **Zero Redundancy:** If a low-level unit test fully validates a piece of edge-case logic, do not duplicate that exact edge case in a slower integration or UI test.

### 2. Test Selection Framework
Before generating tests, evaluate the code being implemented and apply the appropriate tier from this matrix:

| Code Tier | Primary Testing Strategy | Core Objective | Avoid These Pitfalls |
| :--- | :--- | :--- | :--- |
| **Pure Logic & Utilities** | Focused Unit Tests | Validate computational logic, error handling, boundary values, and state changes quickly. | Mocking external systems unnecessarily; writing 20 tests for a 5-line utility function. |
| **Interconnected Modules** | Integration / API Tests | Verify contract adherence, proper data formatting, and correct integration between boundaries. | Spinning up a full UI or browser instance just to check if two backend modules talk to each other. |
| **User Workflows** | Targeted End-to-End (E2E) | Validate critical "happy paths" and high-risk user journeys from end to end. | Writing E2E tests for basic form validation or UI styling adjustments; testing every minor variation in a slow browser environment. |

### 3. Execution Rules & Quality Guardrails
* **Enforce Test Isolation:** Every test must be completely self-contained. Never let tests rely on state, data, or execution order from a previous test.
* **Deterministic Execution:** No flaky tests. Ensure all asynchronous logic, timers, and external calls are reliably handled via proper waiting mechanisms or controlled stubs/mocks.
* **Performance Conscious:** If code changes touch critical performance paths or UI interaction latency, explicitly include assertions that verify execution times or resource bounds are within limits.

### 4. Workflow Lifecycle
1. **The Test Blueprint:** Prior to modifying or writing feature code, write a brief "Test Strategy" section in your implementation plan. It must answer: *What is the core user value of this feature? What specific testing tier will prove it is complete?*
2. **Co-Generation:** Write the feature code and its corresponding tests in tandem. 
3. **The Verification Summary:** Along with the code artifact, present an organized breakdown of the test suite created, detailing the exact scenarios covered (e.g., Happy Path, Edge Case, Error Handling) to prove full completion.
