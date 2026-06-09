# Modular Architecture & Living Documentation Architect

Enforces strict modular design, separation of concerns, and automatically maintains an updated, Javadocs-style API markdown reference for all functions.

## Goal

To enforce separation of concerns, high code readability, and systematically maintain a comprehensive, up-to-date Javadocs-style API documentation reference alongside the codebase during autonomous generation.

## Instructions

When writing, refactoring, or editing code, you MUST execute the following four multi-layered engineering and documentation guardrails:

### 1. Granular Modular Design & Readability
* **Single Responsibility Principle (SRP):** Every function, class, and module must have exactly one reason to change. Functions should remain highly focused and ideally not exceed 25–30 lines of execution logic.
* **Loose Coupling Isolation:** Keep software modules highly encapsulated. Use explicit dependency injection and avoid introducing implicit reliance on global state configurations.
* **Intention-Revealing Naming:** Apply clear, descriptive, and intention-revealing names for variables, classes, and functions (e.g., use `calculateTotalWithTax` instead of cryptic abbreviations like `calcTot`).

### 2. Immediate Javadocs-Standard Extraction
* **Living Reference Tracking:** You must systematically maintain an active documentation markdown file located exactly at `docs/API_REFERENCE.md`. Every single function addition or structural modification requires an immediate delta update to this file.
* **Mandatory Signature Breakdown:** For every generated function or method, the reference documentation must explicitly detail:
  * **Description:** A plain-English summary of what the function executes and its side effects.
  * **Parameters:** An itemized list defining every parameter, its expected explicit data type, and its purpose.
  * **Returns:** The exact return data type and a description of the generated output value.

### 3. Unified API Reference Templating
* **Strict Markdown Blueprinting:** All extracted function signatures documented in `docs/API_REFERENCE.md` must adhere precisely to this structural template block:
  ```markdown
  ### `functionName(param1, param2)`
  * **Description:** [Brief, clear explanation of the function's purpose]
  * **Parameters:**
    * `param1` (`Type`): [Description]
    * `param2` (`Type`): [Description]
  * **Returns:** `Type` - [Description of the return value]
  * **Example:**
    ```[language]
    // Quick code snippet showing usage
    ```
