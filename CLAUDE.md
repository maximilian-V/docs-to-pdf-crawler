# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A flexible documentation crawler that converts any website's documentation into a comprehensive PDF file. The tool is designed to work with any documentation site and is particularly useful for creating offline documentation or AI context files.

## Key Components

- **docs-crawler.js**: Universal documentation crawler
  - Accepts command-line arguments for full configurability
  - Supports custom URL patterns (include/exclude)
  - Configurable crawl depth and content selectors
  - Automatic domain detection and output naming
  - Rate limiting with configurable wait times
  - Works with any documentation website

## Common Commands

### Run the documentation crawler
```bash
# Basic usage
node docs-crawler.js --url https://docs.example.com

# With options
node docs-crawler.js --url https://docs.example.com --depth 3 --output my-docs.pdf --wait 2000
```

### Install dependencies
```bash
npm install
```

## Architecture

The project uses:
1. **Puppeteer** for headless browser automation and PDF generation
2. **pdf-lib** for merging individual PDFs into a single document
3. **yargs** for command-line argument parsing
4. URLs are crawled recursively up to the specified depth
5. PDFs are temporarily stored in `temp-pdfs/` before merging
6. Custom CSS is injected to hide navigation elements and optimize for PDF

## Development Notes

- The crawler respects the same-origin policy and only crawls within the provided domain
- Include/exclude patterns are applied to filter URLs during crawling
- The script handles errors gracefully and continues with other pages if one fails
- Temporary files are automatically cleaned up after merging