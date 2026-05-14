# ci-fix

Diagnoses and fixes CI pipeline failures — find the actual failure line,
classify, reproduce locally with matching toolchain, check environment
differences, fix the root cause (not retry/skip/`continue-on-error`),
verify in a fresh CI run. Example: "Tests pass locally but fail in CI".
