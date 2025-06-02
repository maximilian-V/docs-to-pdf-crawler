# Docs to PDF Crawler

A flexible Node.js tool that crawls any documentation website and generates comprehensive PDF files. Perfect for creating offline documentation, archiving, or using as context for AI tools like Claude.

## Features

- 🕷️ Automatic discovery and crawling of documentation pages
- 🎯 Dynamic domain support - works with any documentation site
- 📄 Individual PDF generation for each page
- 📚 Merges all PDFs into a single comprehensive document
- 🎨 Custom CSS for optimized PDF rendering
- 🔧 Configurable crawl depth, patterns, and selectors
- 🧹 Automatic cleanup of temporary files

## Installation

```bash
npm install
```

## Usage

### Basic Usage

```bash
node docs-crawler.js --url <documentation-url>
```

### Examples

#### Crawl any documentation site:
```bash
node docs-crawler.js --url https://docs.example.com
```

#### Specify output filename:
```bash
node docs-crawler.js --url https://docs.example.com --output my-docs.pdf
```

#### Limit crawl depth:
```bash
node docs-crawler.js --url https://docs.example.com --depth 3
```

#### Include only specific sections:
```bash
node docs-crawler.js --url https://docs.example.com --include /api/ /reference/
```

#### Exclude certain sections:
```bash
node docs-crawler.js --url https://docs.example.com --exclude /blog/ /changelog/
```

#### Custom content selector:
```bash
node docs-crawler.js --url https://docs.example.com --selector "article.documentation"
```

#### Adjust request delay:
```bash
node docs-crawler.js --url https://docs.example.com --wait 2000
```

### Command Line Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--url` | `-u` | Starting URL to crawl (required) | - |
| `--output` | `-o` | Output PDF filename | `<domain>-documentation.pdf` |
| `--depth` | `-d` | Maximum crawl depth | 5 |
| `--include` | `-i` | URL patterns to include (can be repeated) | [] |
| `--exclude` | `-e` | URL patterns to exclude (can be repeated) | [] |
| `--selector` | `-s` | CSS selector for main content | `main, article, .content, .documentation, body` |
| `--wait` | `-w` | Wait time between requests (ms) | 1000 |

### Quick Scripts

#### Generate Essential Klaviyo Documentation
For a curated set of the most important Klaviyo documentation pages:

```bash
node generate-klaviyo-main-docs.js
```

This generates a ~5MB PDF with 20 essential pages including:
- Getting started guides
- Core API concepts
- Main API reference overviews

#### Merge Existing PDFs
If crawling was interrupted, merge whatever PDFs were generated:

```bash
node generate-klaviyo-quick.js
```

### Legacy Scripts

The original scripts are still available:

```bash
# Crawl ALL Klaviyo documentation (comprehensive but slow)
node generate-klaviyo-docs.js

# Generate PDFs for specific hardcoded pages
node generate-pdf.js
```

## How It Works

The crawler uses:
- **Puppeteer** for headless browser automation
- **pdf-lib** for merging PDFs
- **yargs** for command-line argument parsing
- Custom CSS injection to hide navigation elements and optimize content for PDF

## Script Comparison

| Script | Purpose | Speed | Output Size | Customization |
|--------|---------|-------|-------------|---------------|
| `docs-crawler.js` | Any documentation site | Variable | Variable | Full CLI options |
| `generate-klaviyo-main-docs.js` | Essential Klaviyo docs | Fast (~2 min) | ~5MB | Curated pages |
| `generate-klaviyo-docs.js` | Complete Klaviyo docs | Slow | Large | Hardcoded for Klaviyo |
| `generate-pdf.js` | Specific pages only | Fast | Small | Edit URLs in code |

## Output

- Individual PDFs are temporarily stored in `temp-pdfs/`
- Final merged PDF is saved as `klaviyo-complete-documentation.pdf`
- All temporary files are automatically cleaned up after merging

## Requirements

- Node.js 14+
- Chrome/Chromium (automatically downloaded by Puppeteer)

## License

MIT