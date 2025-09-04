# ECOSYSTEMCL.AI Testing Guide

## Test Infrastructure Overview

### Coverage Targets
- **Unit Tests**: 60% coverage (gradual increase to 80%)
- **Integration Tests**: Key workflows covered
- **CDK Tests**: All infrastructure stacks validated

### Test Frameworks
- **Web Package**: Vitest + Testing Library
- **Worker Package**: Jest + Vitest
- **Infra Package**: Jest + CDK Assertions
- **CLI Package**: Jest (Node.js testing)

## Running Tests

### Local Development
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm -F web test:watch

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### Package-Specific Tests
```bash
# Web package tests
pnpm -F web test
pnpm -F web test:ui

# Worker package tests
pnpm -F worker test
pnpm -F worker test:e2e

# Infrastructure tests
pnpm -F infra test

# CLI tests
pnpm -F cli test
```

## CI/CD Pipeline

### GitHub Actions
- **Trigger**: Pull requests and main branch pushes
- **Matrix Strategy**: Parallel testing across packages
- **Quality Gates**: Lint → Type Check → Test → Coverage

### AWS CodeBuild
- **Environment**: Node.js 20, pnpm 8
- **Caching**: node_modules and .pnpm-store
- **Artifacts**: Built packages and CDK outputs

## Pre-commit Hooks

### Setup
```bash
pnpm install
pnpm prepare  # Installs husky hooks
```

### Hooks Enabled
- Linting check
- Type checking
- Test execution
- Coverage validation

## Test Structure

### Web Package (`packages/web`)
```
src/
├── tests/
│   ├── setup.ts           # Test configuration
│   └── components/        # Component tests
├── lib/                   # Business logic tests
└── pages/                 # Page integration tests
```

### Worker Package (`packages/worker`)
```
src/
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/              # End-to-end tests
└── services/             # Service tests
```

### Infrastructure Package (`packages/infra`)
```
tests/
├── stacks.test.ts        # CDK stack tests
├── constructs.test.ts    # Custom construct tests
└── snapshots/            # CDK snapshot tests
```

## Coverage Requirements

### Current Thresholds (60%)
- Branches: 60%
- Functions: 60%
- Lines: 60%
- Statements: 60%

### Target Thresholds (80%)
- New code must meet 80% coverage
- Existing code gradually improved
- Critical paths require 90% coverage

## Testing Best Practices

### Unit Tests
- Test single functions/components
- Mock external dependencies
- Fast execution (< 100ms per test)
- Clear test names and descriptions

### Integration Tests
- Test component interactions
- Use real AWS services in test environment
- Validate end-to-end workflows
- Clean up resources after tests

### CDK Tests
- Validate resource properties
- Check IAM permissions
- Verify stack outputs
- Test cross-stack references

## Mock Strategies

### AWS Services
```typescript
// Mock AWS SDK clients
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => ({
    send: vi.fn()
  }))
}));
```

### Next.js Components
```typescript
// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/'
  })
}));
```

### Amplify
```typescript
// Mock AWS Amplify
vi.mock('aws-amplify', () => ({
  Amplify: { configure: vi.fn() }
}));
```

## Performance Testing

### Load Testing
- Use Artillery.js for API load testing
- Test Lambda cold start performance
- Validate DynamoDB throughput limits

### Benchmark Testing
- Measure OpenSearch query performance
- Test CDC pipeline throughput
- Monitor memory usage patterns

## Debugging Tests

### Common Issues
1. **Timeout Errors**: Increase test timeout for async operations
2. **Mock Failures**: Ensure mocks match actual API signatures
3. **Environment Variables**: Set test-specific env vars

### Debug Commands
```bash
# Run single test file
pnpm -F web test Button.test.tsx

# Debug with verbose output
pnpm -F web test --reporter=verbose

# Run tests with debugger
pnpm -F web test --inspect-brk
```

## Continuous Integration

### Quality Gates
1. **Lint Check**: ESLint rules enforcement
2. **Type Check**: TypeScript compilation
3. **Unit Tests**: Package-level test suites
4. **Coverage**: Minimum threshold validation
5. **CDK Synth**: Infrastructure validation

### Failure Handling
- **Lint Failures**: Block merge until fixed
- **Test Failures**: Require investigation and fix
- **Coverage Drop**: Prevent coverage regression
- **CDK Errors**: Infrastructure changes must be valid

## Test Data Management

### Fixtures
- Store test data in `__fixtures__` directories
- Use factory functions for dynamic test data
- Implement data builders for complex objects

### Database Testing
- Use DynamoDB Local for integration tests
- Implement test data seeding scripts
- Clean up test data after each test run

## Monitoring and Reporting

### Coverage Reports
- HTML reports generated in `coverage/` directories
- LCOV format for CI integration
- Codecov integration for trend analysis

### Test Results
- JUnit XML format for CI systems
- Test timing and performance metrics
- Flaky test detection and reporting

---

**Next Steps:**
1. Install test dependencies: `pnpm install`
2. Run initial test suite: `pnpm test`
3. Set up pre-commit hooks: `pnpm prepare`
4. Configure IDE test runners for development workflow