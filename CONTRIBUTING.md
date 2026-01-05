# Contributing to GPT Image Captioner

Thank you for your interest in contributing to GPT Image Captioner! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Testing](#testing)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bugfix
4. Make your changes
5. Push to your fork and submit a pull request

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- Bun package manager
- OpenAI API key (for testing OpenAI features)
- Ollama installed locally (for testing Ollama features)

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/gpt-flux-img-captioner.git
cd gpt-flux-img-captioner

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
# Add your OpenAI API key to .env

# Start development server
bun dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue using the bug report template. Include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (browser, OS, Node version)

### Suggesting Enhancements

For feature requests, please create an issue using the feature request template. Include:

- A clear and descriptive title
- Detailed description of the proposed feature
- Use cases and benefits
- Any alternative solutions you've considered

### Code Contributions

1. Check existing issues to see if someone is already working on it
2. Comment on the issue to let others know you're working on it
3. Fork the repository and create a branch from `main`
4. Make your changes following our coding standards
5. Test your changes thoroughly
6. Submit a pull request

## Pull Request Process

1. **Branch Naming**: Use descriptive branch names
   - Feature: `feature/add-export-csv`
   - Bug fix: `fix/image-upload-validation`
   - Documentation: `docs/update-readme`

2. **Keep PRs Focused**: Each PR should address a single concern

3. **Update Documentation**: Update README.md or other docs if needed

4. **Add Tests**: If applicable, add tests for your changes

5. **Code Quality**:
   - Run `bun run lint` to check for linting errors
   - Run `bun run prettier` to format your code
   - Ensure the build passes: `bun run build`

6. **PR Description**: Provide a clear description of:
   - What changes were made
   - Why these changes were necessary
   - How to test the changes
   - Any breaking changes

7. **Review Process**:
   - Maintainers will review your PR
   - Address any requested changes
   - Once approved, your PR will be merged

## Coding Standards

### TypeScript/React

- Use TypeScript for all new code
- Follow existing code style and patterns
- Use functional components with hooks
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable and function names

### Component Structure

```typescript
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types/Interfaces
interface MyComponentProps {
  title: string;
}

// Component
export default function MyComponent({ title }: MyComponentProps) {
  // State
  const [count, setCount] = useState(0);

  // Handlers
  const handleClick = () => {
    setCount(count + 1);
  };

  // Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Count: {count}</Button>
    </div>
  );
}
```

### File Organization

- Components: `/src/components/`
- API Routes: `/src/app/api/`
- Utilities: `/src/lib/`
- UI Components: `/src/components/ui/`

### Styling

- Use Tailwind CSS classes
- Follow existing utility class patterns
- Use `clsx` or `cn` for conditional classes
- Maintain responsive design (mobile-first)

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(openai): add GPT-5 model support

fix(ollama): resolve connection timeout issue

docs(readme): update installation instructions

chore: bump dependencies
```

## Testing

### Manual Testing

Before submitting a PR, test your changes:

1. **OpenAI Integration**:
   - Upload single and multiple images
   - Test with different models (GPT-5, GPT-5-mini, GPT-5-nano)
   - Verify prefix/suffix functionality
   - Test custom prompts

2. **Ollama Integration**:
   - Test server connection
   - Verify model selection
   - Test image captioning

3. **UI/UX**:
   - Test responsive design (mobile, tablet, desktop)
   - Verify dark/light theme switching
   - Check error handling and validation
   - Test image preview and validation

4. **Edge Cases**:
   - Large images (>20MB should be rejected)
   - Invalid file types
   - Network errors
   - Empty states

### Future: Automated Testing

We plan to add automated tests. Contributions to testing infrastructure are welcome!

## Questions?

If you have questions, feel free to:

- Open an issue for discussion
- Check existing issues and PRs
- Review the README.md for project documentation

Thank you for contributing! 🎉
