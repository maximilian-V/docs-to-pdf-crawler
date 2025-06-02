# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Klaviyo documentation PDF generator that uses Puppeteer to convert Klaviyo API documentation pages to PDF format.

## Key Components

- **generate-klaviyo-docs.js**: Complete documentation crawler and PDF generator
  - Automatically discovers all Klaviyo documentation pages
  - Crawls through docs and reference sections
  - Generates individual PDFs for each page
  - Merges all PDFs into a single comprehensive document
  - Includes custom CSS for better PDF rendering
  - Adds section separators and title page

- **generate-pdf.js**: Simple script that converts specific web pages to PDFs
  - Uses `puppeteer.launch()` to create a browser instance
  - Navigates to URLs and generates PDFs with A4 format
  - Currently configured to convert Klaviyo API documentation pages

## Common Commands

### Run the complete documentation crawler
```bash
node generate-klaviyo-docs.js
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