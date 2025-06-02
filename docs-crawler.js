const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

class DocsCrawler {
    constructor(options = {}) {
        this.startUrl = options.url;
        this.domain = options.domain || this.extractDomain(options.url);
        this.outputName = options.output || `${this.domain}-documentation.pdf`;
        this.maxDepth = options.depth || 5;
        this.includePatterns = options.include || [];
        this.excludePatterns = options.exclude || [];
        this.selector = options.selector || 'main, article, .content, .documentation, body';
        this.waitTime = options.wait || 1000;
        
        this.visitedUrls = new Set();
        this.urlsToVisit = [];
        this.pdfPaths = [];
        this.outputDir = path.join(__dirname, 'temp-pdfs');
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '').split('.')[0];
        } catch (e) {
            return 'documentation';
        }
    }

    async init() {
        // Create temp directory for individual PDFs
        await fs.mkdir(this.outputDir, { recursive: true });
        
        // Start with the provided URL
        this.urlsToVisit.push(this.startUrl);
        
        console.log(`Starting crawler for: ${this.startUrl}`);
        console.log(`Domain: ${this.domain}`);
        console.log(`Output: ${this.outputName}`);
        console.log(`Max depth: ${this.maxDepth}`);
        if (this.includePatterns.length > 0) {
            console.log(`Include patterns: ${this.includePatterns.join(', ')}`);
        }
        if (this.excludePatterns.length > 0) {
            console.log(`Exclude patterns: ${this.excludePatterns.join(', ')}`);
        }
        console.log('---\n');
    }

    shouldCrawlUrl(url) {
        // Check if URL belongs to the same domain
        try {
            const urlObj = new URL(url);
            const startUrlObj = new URL(this.startUrl);
            
            // Must be same domain
            if (urlObj.hostname !== startUrlObj.hostname) {
                return false;
            }
            
            // Check include patterns if specified
            if (this.includePatterns.length > 0) {
                const matchesInclude = this.includePatterns.some(pattern => 
                    url.includes(pattern)
                );
                if (!matchesInclude) return false;
            }
            
            // Check exclude patterns
            const matchesExclude = this.excludePatterns.some(pattern => 
                url.includes(pattern)
            );
            if (matchesExclude) return false;
            
            // Avoid anchors, images, and other non-documentation links
            const invalidExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', '.tar', '.gz'];
            if (invalidExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
                return false;
            }
            
            return true;
        } catch (e) {
            return false;
        }
    }

    async crawlAndGeneratePDFs() {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const urlDepthMap = new Map();
        urlDepthMap.set(this.startUrl, 0);

        try {
            while (this.urlsToVisit.length > 0) {
                const currentUrl = this.urlsToVisit.shift();
                const currentDepth = urlDepthMap.get(currentUrl) || 0;
                
                if (this.visitedUrls.has(currentUrl)) {
                    continue;
                }

                if (currentDepth > this.maxDepth) {
                    console.log(`Skipping ${currentUrl} - max depth reached`);
                    continue;
                }

                console.log(`[Depth ${currentDepth}] Processing: ${currentUrl}`);
                this.visitedUrls.add(currentUrl);

                const page = await browser.newPage();
                
                try {
                    // Set viewport for consistent rendering
                    await page.setViewport({ width: 1280, height: 800 });
                    
                    // Navigate to the page
                    await page.goto(currentUrl, { 
                        waitUntil: 'networkidle2',
                        timeout: 60000 
                    });

                    // Wait for content to load
                    await page.waitForSelector(this.selector.split(',')[0].trim(), { 
                        timeout: 10000 
                    }).catch(() => {
                        console.log('Primary selector not found, trying fallback...');
                        return page.waitForSelector('body', { timeout: 5000 });
                    });

                    // Extract all links
                    const links = await page.evaluate(() => {
                        const anchorElements = document.querySelectorAll('a');
                        const docLinks = [];
                        
                        anchorElements.forEach(anchor => {
                            const href = anchor.getAttribute('href');
                            if (href && !href.startsWith('#') && !href.startsWith('mailto:')) {
                                // Convert relative URLs to absolute
                                const absoluteUrl = new URL(href, window.location.href).href;
                                docLinks.push(absoluteUrl);
                            }
                        });
                        
                        return [...new Set(docLinks)]; // Remove duplicates
                    });

                    // Add new links to visit
                    links.forEach(link => {
                        if (!this.visitedUrls.has(link) && 
                            !this.urlsToVisit.includes(link) && 
                            this.shouldCrawlUrl(link)) {
                            this.urlsToVisit.push(link);
                            urlDepthMap.set(link, currentDepth + 1);
                        }
                    });

                    // Generate PDF for current page
                    const pdfFileName = this.urlToFileName(currentUrl);
                    const pdfPath = path.join(this.outputDir, pdfFileName);
                    
                    // Add custom CSS to improve PDF rendering
                    await page.addStyleTag({
                        content: `
                            /* Hide navigation and sidebars for cleaner PDFs */
                            nav, aside, .sidebar, .navigation, header, footer, 
                            .header, .footer, .nav, .navbar, .breadcrumb,
                            [class*="cookie"], [class*="banner"], [class*="popup"],
                            [class*="modal"], [class*="overlay"], [class*="alert"] { 
                                display: none !important; 
                            }
                            /* Ensure main content takes full width */
                            main, .main-content, article, .content, .documentation {
                                max-width: 100% !important;
                                margin: 0 auto !important;
                                padding: 20px !important;
                            }
                            /* Improve code block rendering */
                            pre, code {
                                white-space: pre-wrap !important;
                                word-wrap: break-word !important;
                                max-width: 100% !important;
                                overflow-x: auto !important;
                            }
                            /* Better table rendering */
                            table {
                                max-width: 100% !important;
                                overflow-x: auto !important;
                                display: block !important;
                            }
                        `
                    });

                    await page.pdf({ 
                        path: pdfPath, 
                        format: 'A4', 
                        printBackground: true,
                        margin: {
                            top: '20mm',
                            right: '20mm',
                            bottom: '20mm',
                            left: '20mm'
                        }
                    });
                    
                    this.pdfPaths.push({ url: currentUrl, path: pdfPath, depth: currentDepth });
                    console.log(`✓ Generated PDF: ${pdfFileName}`);

                } catch (error) {
                    console.error(`✗ Error processing ${currentUrl}:`, error.message);
                } finally {
                    await page.close();
                }

                // Add a small delay to avoid overwhelming the server
                if (this.waitTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.waitTime));
                }
            }
        } finally {
            await browser.close();
        }

        console.log(`\n📊 Crawl Summary:`);
        console.log(`   Visited: ${this.visitedUrls.size} pages`);
        console.log(`   PDFs generated: ${this.pdfPaths.length}`);
    }

    urlToFileName(url) {
        // Convert URL to a safe filename
        const urlPath = url.replace(/^https?:\/\//, '')
            .replace(/[^a-zA-Z0-9-]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        
        // Truncate if too long
        const maxLength = 100;
        if (urlPath.length > maxLength) {
            return urlPath.substring(0, maxLength) + '.pdf';
        }
        
        return `${urlPath}.pdf`;
    }

    async mergePDFs() {
        console.log('\n📑 Merging PDFs into a single document...');
        
        const mergedPdf = await PDFDocument.create();
        
        // Sort PDFs by depth first, then by URL
        this.pdfPaths.sort((a, b) => {
            if (a.depth !== b.depth) return a.depth - b.depth;
            return a.url.localeCompare(b.url);
        });
        
        // Add a title page
        const titlePage = mergedPdf.addPage();
        const { width, height } = titlePage.getSize();
        const fontSize = 30;
        const text = this.outputName.replace('.pdf', '').replace(/-/g, ' ');
        
        titlePage.drawText(text, {
            x: 50,
            y: height - 100,
            size: fontSize,
        });
        
        titlePage.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
            x: 50,
            y: height - 150,
            size: 12,
        });
        
        titlePage.drawText(`Total pages crawled: ${this.pdfPaths.length}`, {
            x: 50,
            y: height - 180,
            size: 12,
        });
        
        titlePage.drawText(`Source: ${this.startUrl}`, {
            x: 50,
            y: height - 210,
            size: 10,
        });

        // Add table of contents
        const tocPage = mergedPdf.addPage();
        tocPage.drawText('Table of Contents', {
            x: 50,
            y: height - 50,
            size: 20,
        });
        
        let tocY = height - 100;
        const tocItems = [];
        
        // Merge all PDFs
        for (let i = 0; i < this.pdfPaths.length; i++) {
            const { url, path: pdfPath, depth } = this.pdfPaths[i];
            console.log(`Merging ${i + 1}/${this.pdfPaths.length}: ${url}`);
            
            try {
                const pdfBytes = await fs.readFile(pdfPath);
                const pdf = await PDFDocument.load(pdfBytes);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                
                // Add a separator page with the URL
                const separatorPage = mergedPdf.addPage();
                const { width: sepWidth, height: sepHeight } = separatorPage.getSize();
                
                // Draw section header
                const indent = depth * 20;
                separatorPage.drawText('Section:', {
                    x: 50 + indent,
                    y: sepHeight - 100,
                    size: 14,
                });
                
                // Draw URL (truncate if necessary)
                const maxUrlLength = 80;
                const displayUrl = url.length > maxUrlLength 
                    ? url.substring(0, maxUrlLength) + '...' 
                    : url;
                    
                separatorPage.drawText(displayUrl, {
                    x: 50 + indent,
                    y: sepHeight - 130,
                    size: 10,
                });
                
                // Add the actual content pages
                pages.forEach(page => mergedPdf.addPage(page));
                
                // Track for TOC
                tocItems.push({ url: displayUrl, depth });
                
            } catch (error) {
                console.error(`✗ Error merging PDF for ${url}:`, error.message);
            }
        }

        // Save the merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        const outputPath = path.join(__dirname, this.outputName);
        await fs.writeFile(outputPath, mergedPdfBytes);
        
        console.log(`\n✅ Merged PDF saved as: ${outputPath}`);
        
        // Cleanup temporary PDFs
        await this.cleanup();
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up temporary files...');
        
        for (const { path: pdfPath } of this.pdfPaths) {
            try {
                await fs.unlink(pdfPath);
            } catch (error) {
                console.error(`Error deleting ${pdfPath}:`, error.message);
            }
        }
        
        try {
            await fs.rmdir(this.outputDir);
        } catch (error) {
            console.error(`Error removing temp directory:`, error.message);
        }
    }

    async run() {
        console.log('🚀 Starting documentation crawler...\n');
        
        await this.init();
        await this.crawlAndGeneratePDFs();
        await this.mergePDFs();
        
        console.log('\n✨ Process completed!');
    }
}

// CLI setup
const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 --url <url> [options]')
    .option('url', {
        alias: 'u',
        describe: 'Starting URL to crawl',
        type: 'string',
        demandOption: true
    })
    .option('output', {
        alias: 'o',
        describe: 'Output PDF filename',
        type: 'string'
    })
    .option('depth', {
        alias: 'd',
        describe: 'Maximum crawl depth',
        type: 'number',
        default: 5
    })
    .option('include', {
        alias: 'i',
        describe: 'URL patterns to include (can be used multiple times)',
        type: 'array',
        default: []
    })
    .option('exclude', {
        alias: 'e',
        describe: 'URL patterns to exclude (can be used multiple times)',
        type: 'array',
        default: []
    })
    .option('selector', {
        alias: 's',
        describe: 'CSS selector for main content',
        type: 'string',
        default: 'main, article, .content, .documentation, body'
    })
    .option('wait', {
        alias: 'w',
        describe: 'Wait time between requests (ms)',
        type: 'number',
        default: 1000
    })
    .example('$0 --url https://docs.example.com', 'Crawl documentation starting from the given URL')
    .example('$0 --url https://docs.example.com --include /api/ /guides/', 'Only crawl URLs containing /api/ or /guides/')
    .example('$0 --url https://docs.example.com --exclude /blog/ /forum/', 'Exclude blog and forum pages')
    .example('$0 --url https://docs.example.com --depth 3 --output my-docs.pdf', 'Limit depth and specify output name')
    .help()
    .argv;

// Run the crawler
(async () => {
    const crawler = new DocsCrawler(argv);
    await crawler.run();
})().catch(console.error);