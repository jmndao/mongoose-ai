# Contributing to mongoose-ai

Thank you for your interest in contributing to mongoose-ai! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm 8+
- MongoDB (for testing)
- OpenAI API key (for testing)

### Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/yourusername/mongoose-ai.git
   cd mongoose-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Add your OPENAI_API_KEY and MONGODB_URI
   ```

4. **Run tests to ensure everything works**
   ```bash
   npm test
   ```

## 🔧 Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Watch mode build
npm run build           # Production build

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode tests
npm run test:coverage   # Generate coverage report

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
npm run typecheck       # TypeScript checking
npm run validate        # Run all checks

# Examples
npm run example:basic   # Run basic usage example
npm run example:advanced # Run advanced usage example
```

### Making Changes

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   - Write clean, documented code
   - Follow existing code style
   - Add tests for new functionality

3. **Test your changes**

   ```bash
   npm run validate  # Runs all checks
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

## 📝 Code Style Guidelines

### TypeScript

- Use TypeScript for all source code
- Provide proper type definitions
- Export types that users might need
- Use interfaces for object types

### Code Formatting

- Use ESLint configuration provided
- 2 spaces for indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in multiline objects/arrays

### Naming Conventions

- **Files**: kebab-case (`user-profile.ts`)
- **Classes**: PascalCase (`OpenAIProvider`)
- **Functions/Variables**: camelCase (`createAIConfig`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CONFIG`)
- **Types/Interfaces**: PascalCase with descriptive names (`AIPluginOptions`)

## 🧪 Testing Guidelines

### Writing Tests

- Write tests for all new functionality
- Use descriptive test names
- Group related tests with `describe` blocks
- Mock external dependencies (OpenAI API)

### Test Structure

```typescript
describe("Feature Name", () => {
  describe("specific functionality", () => {
    it("should do something specific", () => {
      // Test implementation
    });
  });
});
```

### Test Coverage

- Aim for high test coverage (>90%)
- Test both success and error cases
- Test edge cases and boundary conditions

## 📚 Documentation

### Code Documentation

- Use JSDoc comments for public APIs
- Document complex logic inline
- Keep comments up-to-date with code changes

### README Updates

- Update README.md for new features
- Add examples for new functionality
- Keep API documentation current

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description** - Clear description of the issue
2. **Reproduction** - Steps to reproduce the bug
3. **Expected vs Actual** - What should happen vs what happens
4. **Environment** - Node.js version, dependencies, etc.
5. **Code Sample** - Minimal code that demonstrates the issue

## 💡 Feature Requests

For new features:

1. **Use Case** - Describe the problem you're solving
2. **Proposed Solution** - How you think it should work
3. **Alternatives** - Other solutions you've considered
4. **Impact** - Who would benefit from this feature

## 🔄 Pull Request Process

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Code is properly typed (`npm run typecheck`)
- [ ] Code follows style guidelines (`npm run lint`)
- [ ] Documentation is updated
- [ ] Commit messages follow convention

### PR Description

Include in your PR:

- **What**: Brief description of changes
- **Why**: Reason for the changes
- **How**: Technical approach used
- **Testing**: How you tested the changes
- **Breaking Changes**: Any breaking changes (if applicable)

### Review Process

1. **Automated Checks** - CI will run tests and checks
2. **Code Review** - Maintainers will review your code
3. **Feedback** - Address any feedback promptly
4. **Merge** - Once approved, your PR will be merged

## 🏷️ Commit Message Convention

Use conventional commits:

```
type(scope): description

feat: add semantic search functionality
fix: resolve embedding generation error
docs: update API documentation
test: add tests for user profiles
refactor: simplify error handling
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `style`: Code style changes
- `perf`: Performance improvements
- `chore`: Maintenance tasks

## 🌟 Recognition

Contributors will be:

- Listed in the README
- Mentioned in release notes
- Given credit in relevant documentation

## ❓ Questions?

- **General Questions**: Open a GitHub Discussion
- **Bug Reports**: Open a GitHub Issue
- **Feature Requests**: Open a GitHub Issue
- **Security Issues**: Email maintainers directly

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to mongoose-ai! 🚀
