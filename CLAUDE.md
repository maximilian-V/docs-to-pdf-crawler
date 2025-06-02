# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Klaviyo documentation PDF generator that uses Puppeteer to convert Klaviyo API documentation pages to PDF format.

## Key Components

- **docs-crawler.js**: Flexible documentation crawler for any website
  - Accepts command-line arguments for dynamic configuration
  - Supports custom URL patterns (include/exclude)
  - Configurable crawl depth and content selectors
  - Automatic domain detection and output naming
  - Rate limiting with configurable wait times
  - Works with any documentation website

- **generate-klaviyo-main-docs.js**: Fast, curated Klaviyo documentation generator
  - Generates PDFs for 20 essential Klaviyo documentation pages
  - Includes getting started, core concepts, and main API references
  - Produces a ~5MB PDF in about 2 minutes
  - Better wait handling for dynamic content loading
  - Page numbers in PDF footers

- **generate-klaviyo-quick.js**: PDF merger utility
  - Merges any existing PDFs in the temp-pdfs directory
  - Useful for salvaging work if crawling is interrupted
  - Adds a title page with generation date and page count

- **generate-klaviyo-docs.js**: Comprehensive Klaviyo documentation crawler
  - Attempts to discover ALL Klaviyo documentation pages
  - Can take a long time and may timeout on large sites
  - Generates individual PDFs for each page
  - Merges all PDFs into a single comprehensive document

- **generate-pdf.js**: Simple script that converts specific web pages to PDFs
  - Uses hardcoded URL list
  - Quick for generating PDFs of specific pages
  - Edit the `urls` array to customize

## Common Commands

### Run the flexible documentation crawler
```bash
# Basic usage
node docs-crawler.js --url https://docs.example.com

# With options
node docs-crawler.js --url https://docs.example.com --depth 3 --output my-docs.pdf
```

### Generate essential Klaviyo documentation (recommended)
```bash
node generate-klaviyo-main-docs.js
```

### Run the comprehensive Klaviyo crawler
```bash
node generate-klaviyo-docs.js
```

### Merge existing PDFs
```bash
node generate-klaviyo-quick.js
```

### Run the simple PDF generator
```bash
node generate-pdf.js
```

### Install dependencies
```bash
npm install
```

## Architecture

The project uses a simple architecture:
1. **Puppeteer** for headless browser automation and PDF generation
2. URLs are defined in the `urls` array in generate-pdf.js:14
3. PDFs are generated in the project root directory with filenames based on the URL's last segment

## Development Notes

- To add more pages for PDF generation, add URLs to the `urls` array in generate-pdf.js
- Generated PDFs are saved in the project root directory
- The script waits for 'networkidle2' before generating PDFs to ensure all content is loaded