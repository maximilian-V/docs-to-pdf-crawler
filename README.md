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

## How It Works

The crawler:
1. Starts from the provided URL
2. Discovers all linked pages within the same domain
3. Respects the configured depth limit
4. Applies include/exclude patterns to filter URLs
5. Generates individual PDFs with custom CSS for better rendering
6. Merges all PDFs into a single document with a table of contents
7. Cleans up temporary files

## Output

- Individual PDFs are temporarily stored in `temp-pdfs/`
- Final merged PDF is saved with the specified filename
- All temporary files are automatically cleaned up

## Use Cases

- **Offline Documentation**: Create PDF versions of online documentation
- **AI Context**: Generate comprehensive documentation PDFs for use with AI assistants like Claude
- **Archiving**: Preserve documentation at a specific point in time
- **Sharing**: Distribute documentation to team members without internet access

## Requirements

- Node.js 14+
- Chrome/Chromium (automatically downloaded by Puppeteer)

## License

MIT