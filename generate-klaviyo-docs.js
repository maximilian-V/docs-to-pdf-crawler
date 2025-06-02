const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');

class KlaviyoDocsCrawler {
    constructor() {
        this.baseUrl = 'https://developers.klaviyo.com';
        this.visitedUrls = new Set();
        this.urlsToVisit = [];
        this.pdfPaths = [];
        this.outputDir = path.join(__dirname, 'temp-pdfs');
    }

    async init() {
        // Create temp directory for individual PDFs
        await fs.mkdir(this.outputDir, { recursive: true });
        
        // Start with the main documentation page
        this.urlsToVisit.push('https://developers.klaviyo.com/en/docs');
    }

    async crawlAndGeneratePDFs() {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            while (this.urlsToVisit.length > 0) {
                const currentUrl = this.urlsToVisit.shift();
                
                if (this.visitedUrls.has(currentUrl)) {
                    continue;
                }

                console.log(`Processing: ${currentUrl}`);
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
                    await page.waitForSelector('main', { timeout: 10000 }).catch(() => {
                        console.log('Main content not found, trying body...');
                        return page.waitForSelector('body', { timeout: 5000 });
                    });

                    // Extract all documentation links
                    const links = await page.evaluate((baseUrl) => {
                        const anchorElements = document.querySelectorAll('a');
                        const docLinks = [];
                        
                        anchorElements.forEach(anchor => {
                            const href = anchor.getAttribute('href');
                            if (href) {
                                // Filter for documentation links
                                if (href.includes('/en/docs') || href.includes('/en/reference')) {
                                    if (href.startsWith('http')) {
                                        docLinks.push(href);
                                    } else if (href.startsWith('/')) {
                                        docLinks.push(baseUrl + href);
                                    }
                                }
                            }
                        });
                        
                        return [...new Set(docLinks)]; // Remove duplicates
                    }, this.baseUrl);

                    // Add new links to visit
                    links.forEach(link => {
                        if (!this.visitedUrls.has(link) && !this.urlsToVisit.includes(link)) {
                            // Only add Klaviyo documentation links
                            if (link.includes('developers.klaviyo.com')) {
                                this.urlsToVisit.push(link);
                            }
                        }
                    });

                    // Generate PDF for current page
                    const pdfFileName = this.urlToFileName(currentUrl);
                    const pdfPath = path.join(this.outputDir, pdfFileName);
                    
                    // Add custom CSS to improve PDF rendering
                    await page.addStyleTag({
                        content: `
                            /* Hide navigation and sidebars for cleaner PDFs */
                            nav, aside, .sidebar, .navigation, header, footer { 
                                display: none !important; 
                            }
                            /* Ensure main content takes full width */
                            main, .main-content, article {
                                max-width: 100% !important;
                                margin: 0 auto !important;
                                padding: 20px !important;
                            }
                            /* Improve code block rendering */
                            pre, code {
                                white-space: pre-wrap !important;
                                word-wrap: break-word !important;
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
                    
                    this.pdfPaths.push({ url: currentUrl, path: pdfPath });
                    console.log(`Generated PDF: ${pdfFileName}`);

                } catch (error) {
                    console.error(`Error processing ${currentUrl}:`, error.message);
                } finally {
                    await page.close();
                }

                // Add a small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } finally {
            await browser.close();
        }

        console.log(`\nCrawled ${this.visitedUrls.size} pages`);
        console.log(`Generated ${this.pdfPaths.length} PDFs`);
    }

    urlToFileName(url) {
        // Convert URL to a safe filename
        const urlPath = url.replace(this.baseUrl, '')
            .replace(/^\//, '')
            .replace(/\//g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '_');
        
        return `${urlPath || 'index'}.pdf`;
    }

    async mergePDFs() {
        console.log('\nMerging PDFs into a single document...');
        
        const mergedPdf = await PDFDocument.create();
        
        // Sort PDFs by URL to maintain a logical order
        this.pdfPaths.sort((a, b) => a.url.localeCompare(b.url));
        
        // Add a title page
        const titlePage = mergedPdf.addPage();
        const { width, height } = titlePage.getSize();
        titlePage.drawText('Klaviyo API Documentation', {
            x: 50,
            y: height - 100,
            size: 30,
        });
        
        titlePage.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
            x: 50,
            y: height - 150,
            size: 12,
        });
        
        titlePage.drawText(`Total pages: ${this.pdfPaths.length}`, {
            x: 50,
            y: height - 180,
            size: 12,
        });

        // Merge all PDFs
        for (let i = 0; i < this.pdfPaths.length; i++) {
            const { url, path: pdfPath } = this.pdfPaths[i];
            console.log(`Merging ${i + 1}/${this.pdfPaths.length}: ${url}`);
            
            try {
                const pdfBytes = await fs.readFile(pdfPath);
                const pdf = await PDFDocument.load(pdfBytes);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                
                // Add a separator page with the URL
                const separatorPage = mergedPdf.addPage();
                const { width: sepWidth, height: sepHeight } = separatorPage.getSize();
                separatorPage.drawText('Section: ' + url, {
                    x: 50,
                    y: sepHeight - 100,
                    size: 14,
                });
                
                // Add the actual content pages
                pages.forEach(page => mergedPdf.addPage(page));
                
            } catch (error) {
                console.error(`Error merging PDF for ${url}:`, error.message);
            }
        }

        // Save the merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        const outputPath = path.join(__dirname, 'klaviyo-complete-documentation.pdf');
        await fs.writeFile(outputPath, mergedPdfBytes);
        
        console.log(`\nMerged PDF saved as: ${outputPath}`);
        
        // Cleanup temporary PDFs
        await this.cleanup();
    }

    async cleanup() {
        console.log('\nCleaning up temporary files...');
        
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
        console.log('Starting Klaviyo documentation crawler...\n');
        
        await this.init();
        await this.crawlAndGeneratePDFs();
        await this.mergePDFs();
        
        console.log('\nProcess completed!');
    }
}

// Run the crawler
(async () => {
    const crawler = new KlaviyoDocsCrawler();
    await crawler.run();
})().catch(console.error);