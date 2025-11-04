# Examples

This directory contains example configurations and test services to demonstrate the Service Standards Auditor.

## Configuration Files

### basic-rules.yml

A simple configuration for common checks:

- README.md exists
- Dockerfile exists
- package.json exists
- Semantic versioning

Usage:

```bash
ssa --path ./examples/services --config ./examples/basic-rules.yml --output json --outdir ./reports
```

### minimal-rules.yml

Minimal configuration for quick setup:

- README.md (required)
- Dockerfile (optional)
- Semantic versioning (optional)

Usage:

```bash
ssa --path ./examples/services --config ./examples/minimal-rules.yml --output md --outdir ./reports
```

### comprehensive-rules.yml

Complete configuration demonstrating all available rule types:

- Documentation checks
- Container support
- Testing requirements
- Code coverage (80% threshold)
- Version management
- Configuration files
- CI/CD

Usage:

```bash
ssa --path ./examples/services --config ./examples/comprehensive-rules.yml --output both --outdir ./reports
```

## Test Services

### compliant-service

A fully compliant service that passes all standard checks:

- ✅ Has README.md
- ✅ Has Dockerfile
- ✅ Uses semantic versioning (1.2.3)
- ✅ Has test files
- ✅ Has test coverage (85%)
- ✅ Has .gitignore

### non-compliant-service

A service with intentional compliance issues:

- ❌ No README.md
- ❌ No Dockerfile
- ❌ Invalid semantic version
- ❌ No test files
- ❌ No test coverage

## Running Examples

Try auditing both services with different configurations:

```bash
# Basic audit
npm run build
npm start -- --path ./examples/services/compliant-service --config ./examples/basic-rules.yml --output json --outdir ./reports

# Audit multiple services
npm start -- --path ./examples/services --config ./examples/basic-rules.yml --output both --outdir ./reports

# Comprehensive audit
npm start -- --path ./examples/services --config ./examples/comprehensive-rules.yml --output html --outdir ./reports
```

## Expected Results

### Compliant Service

- Should pass all basic checks
- Should get high compliance score
- May fail some comprehensive checks (e.g., CONTRIBUTING.md, CI workflow)

### Non-Compliant Service

- Should fail README check
- Should fail Dockerfile check
- Should fail semantic versioning check
- Should fail all test-related checks
