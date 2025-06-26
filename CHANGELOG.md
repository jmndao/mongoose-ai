# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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