# Docs to PDF Crawler

A Node.js tool that crawls documentation websites and generates comprehensive PDF files. Currently configured for Klaviyo API documentation but can be adapted for other documentation sites.

## Features

- 🕷️ Automatic discovery of all documentation pages
- 📄 Individual PDF generation for each page
- 📚 Merges all PDFs into a single comprehensive document
- 🎨 Custom CSS for optimized PDF rendering
- 🧹 Automatic cleanup of temporary files

## Installation

```bash
npm install
```

## Usage

### Generate Complete Documentation PDF

To crawl and generate a complete PDF of all Klaviyo documentation:

```bash
node generate-klaviyo-docs.js
```

This will:
1. Start from the main documentation page
2. Discover all linked documentation pages
3. Generate individual PDFs for each page
4. Merge all PDFs into `klaviyo-complete-documentation.pdf`

### Generate Specific Pages

To generate PDFs for specific pages only:

```bash
node generate-pdf.js
```

Edit the `urls` array in `generate-pdf.js` to specify which pages to convert.

## How It Works

The crawler uses:
- **Puppeteer** for headless browser automation
- **pdf-lib** for merging PDFs
- Custom CSS injection to hide navigation elements and optimize content for PDF

## Configuration

The main crawler (`generate-klaviyo-docs.js`) can be configured by modifying:
- `baseUrl`: The base URL of the documentation site
- Starting URLs in the `init()` method
- URL filtering logic in the `crawlAndGeneratePDFs()` method

## Output

- Individual PDFs are temporarily stored in `temp-pdfs/`
- Final merged PDF is saved as `klaviyo-complete-documentation.pdf`
- All temporary files are automatically cleaned up after merging

## Requirements

- Node.js 14+
- Chrome/Chromium (automatically downloaded by Puppeteer)

## License

MIT