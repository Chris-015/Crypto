---
name: Primevora artifact verification
description: Environment-specific verification notes for the Primevora web artifact.
---

Primevora's Vite configuration intentionally requires both PORT and BASE_PATH. Managed artifact workflows provide them; standalone build checks must provide equivalent values.

**Why:** Running the package build without the artifact runtime contract fails before Vite loads, which can look like an application build regression when it is only missing workflow configuration.

**How to apply:** Use the managed web workflow for runtime verification, or provide the artifact's port and preview base path when running a one-off production build.