const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');

// Main documentation pages we want to capture
const mainDocPages = [
    'https://developers.klaviyo.com/en/docs',
    'https://developers.klaviyo.com/en/docs/get_started',
    'https://developers.klaviyo.com/en/docs/create_a_test_account',
    'https://developers.klaviyo.com/en/docs/install_a_library',
    'https://developers.klaviyo.com/en/docs/authenticate_',
    'https://developers.klaviyo.com/en/docs/make_your_first_api_call',
    'https://developers.klaviyo.com/en/docs/rate_limits_and_error_handling',
    'https://developers.klaviyo.com/en/docs/introduction_to_klaviyos_data_model',
    'https://developers.klaviyo.com/en/docs/klaviyos_architecture',
    'https://developers.klaviyo.com/en/docs/relationships_',
    'https://developers.klaviyo.com/en/docs/filtering_',
    'https://developers.klaviyo.com/en/docs/sorting_',
    'https://developers.klaviyo.com/en/docs/sparse_fieldsets',
    'https://developers.klaviyo.com/en/reference/api_overview',
    'https://developers.klaviyo.com/en/reference/catalogs_api_overview',
    'https://developers.klaviyo.com/en/reference/lists_api_overview',
    'https://developers.klaviyo.com/en/reference/profiles_api_overview',
    'https://developers.klaviyo.com/en/reference/events_api_overview',
    'https://developers.klaviyo.com/en/reference/flows_api_overview',
    'https://developers.klaviyo.com/en/reference/campaigns_api_overview'
];

async function generateKlaviyoDocs() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const outputDir = path.join(__dirname, 'klaviyo-pdfs');
    await fs.mkdir(outputDir, { recursive: true });
    
    const pdfPaths = [];
    
    console.log('🚀 Generating Klaviyo documentation PDFs...\n');
    
    for (let i = 0; i < mainDocPages.length; i++) {
        const url = mainDocPages[i];
        console.log(`[${i + 1}/${mainDocPages.length}] Processing: ${url}`);
        
        const page = await browser.newPage();
        
        try {
            // Set a larger viewport
            await page.setViewport({ width: 1280, height: 1024 });
            
            // Go to the page
            await page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: 60000 
            });
            
            // Wait a bit more for dynamic content
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Inject CSS to hide navigation and improve rendering
            await page.addStyleTag({
                content: `
                    /* Hide navigation elements */
                    nav, header, footer, aside, .sidebar, .navigation,
                    [class*="cookie"], [class*="banner"], [class*="popup"] { 
                        display: none !important; 
                    }
                    
                    /* Ensure content takes full width */
                    main, article, .content, .documentation {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 20px !important;
                    }
                    
                    /* Better code rendering */
                    pre, code {
                        white-space: pre-wrap !important;
                        word-wrap: break-word !important;
                    }
                    
                    /* Hide any sticky elements */
                    [style*="position: fixed"],
                    [style*="position: sticky"] {
                        display: none !important;
                    }
                `
            });
            
            // Generate filename
            const filename = url.split('/').pop().replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
            const pdfPath = path.join(outputDir, filename);
            
            // Generate PDF
            await page.pdf({ 
                path: pdfPath, 
                format: 'A4', 
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                },
                displayHeaderFooter: true,
                headerTemplate: '<div></div>',
                footerTemplate: `
                    <div style="font-size: 10px; text-align: center; width: 100%;">
                        <span class="pageNumber"></span> / <span class="totalPages"></span>
                    </div>
                `
            });
            
            pdfPaths.push({ url, path: pdfPath });
            console.log(`✓ Generated: ${filename}`);
            
        } catch (error) {
            console.error(`✗ Error with ${url}:`, error.message);
        } finally {
            await page.close();
        }
    }
    
    await browser.close();
    
    console.log('\n📑 Merging PDFs...');
    
    // Merge all PDFs
    const mergedPdf = await PDFDocument.create();
    
    // Add title page
    const titlePage = mergedPdf.addPage();
    const { width, height } = titlePage.getSize();
    
    titlePage.drawText('Klaviyo API Documentation', {
        x: 50,
        y: height - 100,
        size: 30,
    });
    
    titlePage.drawText(`Essential Developer Resources`, {
        x: 50,
        y: height - 140,
        size: 16,
    });
    
    titlePage.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
        x: 50,
        y: height - 180,
        size: 12,
    });
    
    titlePage.drawText(`Pages included: ${pdfPaths.length}`, {
        x: 50,
        y: height - 210,
        size: 12,
    });
    
    // Merge all PDFs
    for (const { url, path: pdfPath } of pdfPaths) {
        try {
            const pdfBytes = await fs.readFile(pdfPath);
            const pdf = await PDFDocument.load(pdfBytes);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
        } catch (error) {
            console.error(`Error merging ${pdfPath}:`, error.message);
        }
    }
    
    // Save final PDF
    const mergedPdfBytes = await mergedPdf.save();
    const outputPath = path.join(__dirname, 'klaviyo-docs-essential.pdf');
    await fs.writeFile(outputPath, mergedPdfBytes);
    
    console.log(`\n✅ Complete documentation saved as: klaviyo-docs-essential.pdf`);
    
    // Cleanup
    console.log('\n🧹 Cleaning up temporary files...');
    for (const { path: pdfPath } of pdfPaths) {
        await fs.unlink(pdfPath).catch(() => {});
    }
    await fs.rmdir(outputDir).catch(() => {});
    
    console.log('\n✨ Done!');
}

// Run it
generateKlaviyoDocs().catch(console.error);