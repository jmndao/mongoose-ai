# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Per-version notes from v1.6.0 onward are also published as [GitHub Releases](https://github.com/jmndao/mongoose-ai/releases) and are auto-generated from [Changesets](https://github.com/changesets/changesets) entries.

## 1.6.0

Releases are now published automatically from GitHub Actions with npm provenance, via Changesets and npm Trusted Publishing (OIDC). No more laptop-driven `npm publish`. See [the release notes](https://github.com/jmndao/mongoose-ai/releases/tag/v1.6.0) for full details.

## 1.5.0 — Modern defaults

- Default OpenAI chat model: `gpt-3.5-turbo` → `gpt-4o-mini` ([#1](https://github.com/jmndao/mongoose-ai/issues/1))
- Default Anthropic chat model: `claude-3-haiku-20240307` → `claude-haiku-4-5` ([#5](https://github.com/jmndao/mongoose-ai/issues/5))
- Enabled TypeScript `strict` mode ([#4](https://github.com/jmndao/mongoose-ai/issues/4))

## [1.3.4] - 2025-06-28

### Changed
- v1.4.0: MongoDB Atlas Vector Search Integration and Performance Enhancements

## [1.3.3] - 2025-06-27

### Changed
- Update homepage URL to new landing page

## [1.3.2] - 2025-06-27

### Changed
- docs: update CHANGELOG for v1.3.3 and modify release scripts to include automatic changelog commits
- docs: consolidate version updates in CHANGELOG for v1.3.3
- docs: update version in CHANGELOG and README for v1.3.3
- docs: update version in CHANGELOG to v1.3.3
- docs: update version in release notes to v1.3.3

## [1.3.2] - 2025-06-27

### Changed
- docs: consolidate version updates in CHANGELOG for v1.3.3
- docs: update version in CHANGELOG and README for v1.3.3
- docs: update version in CHANGELOG to v1.3.3
- docs: update version in release notes to v1.3.3

## [1.3.2] - 2025-06-27

### Changed
- docs: update version in CHANGELOG and README for v1.3.3
- docs: update version in CHANGELOG to v1.3.3
- docs: update version in release notes to v1.3.3

## [1.3.2] - 2025-06-27

### Changed
- docs: update version in CHANGELOG to v1.3.3
- docs: update version in release notes to v1.3.3

## [1.3.2] - 2025-06-27

### Changed
- docs: update version in release notes to v1.3.3

## [1.0.3] - 2025-06-26

### Added
- feat: enhance development workflow and example reliability

## [1.0.3] - 2025-06-26

### Added
- feat: enhance development workflow and example reliability

## [1.0.3] - 2025-06-26

### Added
- WithAI and WithAIDocument helper types for better TypeScript support
- Type guards (hasAIMethods, hasAIDocumentMethods) for runtime checking
- Additional utility functions exported from types module

### Fixed
- Export configuration for utility functions
- TypeScript type definitions improvements

## [1.0.2] - 2025-06-25

### Fixed
- Module export issues with utility functions
- TypeScript declaration files for better IDE support

## [1.0.1] - 2025-06-25

### Fixed
- Export of hasAIMethods, hasAIDocumentMethods, isSearchResult functions
- Documentation updates for utility functions

## [1.0.0] - 2025-06-25

### Added
- Initial release of mongoose-ai
- AI-powered document summarization using OpenAI
- Semantic search with vector embeddings
- Full TypeScript support
- Configurable AI processing with field filtering
- Error handling with retry logic
- Cost tracking and estimation utilities
- Performance monitoring tools
- Docker support for development
- Comprehensive documentation and examples

### Features
- Auto-summarization on document save
- Natural language semantic search
- Support for summary and embedding models
- Advanced configuration options
- Production-ready error handling
- Built-in performance optimization

### Performance
- Average processing: 1.6 seconds per document
- Throughput: 38+ documents per minute
- Cost: $0.0003 per document
- 99.7% faster than manual processing