# Contributing to mongoose-ai

Thank you for your interest in contributing to mongoose-ai! We welcome contributions from the community.

## Getting Started

### Prerequisites

- Node.js 16+
- npm 8+
- MongoDB (for testing)
- OpenAI API key (for testing)

### Development Setup

1. Fork and clone the repository

```bash
git clone https://github.com/jmndao/mongoose-ai.git
cd mongoose-ai
```

2. Install dependencies

```bash
npm install
```

3. Create environment file

```bash
cp .env.example .env
# Add your OPENAI_API_KEY and MONGODB_URI
```

4. Run tests

```bash
npm test
```

## Development Workflow

### Making Changes

1. Create a new branch

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes
3. Add or update tests
4. Run the test suite

```bash
npm run validate
```

5. Commit your changes

```bash
git commit -m "feat: add new feature"
```

### Testing

- Run tests: `npm test`
- Run with coverage: `npm run test:coverage`
- Run specific test: `npm test -- plugin.test.ts`
- Run examples: `npm run example:basic`

### Code Quality

We maintain high code quality standards:

- TypeScript strict mode enabled
- ESLint for code linting
- Jest for testing
- 100% test coverage target

Run quality checks:

```bash
npm run lint          # Check code style
npm run typecheck     # Check TypeScript
npm run test:coverage # Check test coverage
npm run validate      # Run all checks
```

## Submitting Changes

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add changeset entry if applicable
4. Submit pull request with clear description

### Pull Request Guidelines

- Use clear, descriptive commit messages
- Follow conventional commit format: `type: description`
- Include tests for new features
- Update documentation for API changes
- Keep changes focused and atomic

### Commit Message Format

```
type: brief description

Optional longer description explaining the change
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Project Structure

```
src/
├── index.ts          # Main exports
├── plugin.ts         # Core plugin implementation
├── types.ts          # TypeScript definitions
└── providers/
    └── openai.ts     # OpenAI provider

tests/
├── plugin.test.ts    # Plugin tests
└── setup.ts          # Test configuration

examples/
├── basic-usage.ts    # Basic examples
├── benchmark-demo.ts # Performance benchmarks
├── scaling-test.ts   # Scaling tests
└── usage.ts          # Advanced usage examples

docs/
├── benchmark-results.md
├── docker-setup.md
└── scaling-guide.md
```

## Guidelines

### Bug Reports

When reporting bugs, please include:

- Node.js and npm versions
- Mongoose version
- Error messages and stack traces
- Minimal reproduction case
- Expected vs actual behavior

### Feature Requests

For new features:

- Describe the use case
- Explain why it's valuable
- Consider implementation complexity
- Check if it aligns with project goals

### Documentation

- Keep examples up to date
- Use clear, concise language
- Include code examples where helpful
- Test documentation examples

## Release Process

Releases are handled by maintainers:

1. Version bumping follows semantic versioning
2. Changelog is updated automatically
3. GitHub releases include detailed notes
4. npm packages are published automatically

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Join discussions on GitHub
- Read the documentation and examples

## Code of Conduct

Please be respectful and professional in all interactions. We aim to maintain a welcoming environment for all contributors.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
