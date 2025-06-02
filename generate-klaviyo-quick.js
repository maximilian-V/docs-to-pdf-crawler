const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');

// Quick script to generate Klaviyo docs with whatever we already have
async function mergeTempPDFs() {
    const outputDir = path.join(__dirname, 'temp-pdfs');
    
    try {
        const files = await fs.readdir(outputDir);
        const pdfFiles = files.filter(f => f.endsWith('.pdf')).sort();
        
        if (pdfFiles.length === 0) {
            console.log('No PDFs found to merge!');
            return;
        }
        
        console.log(`Found ${pdfFiles.length} PDFs to merge`);
        
        const mergedPdf = await PDFDocument.create();
        
        // Add title page
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
        
        titlePage.drawText(`Total pages: ${pdfFiles.length}`, {
            x: 50,
            y: height - 180,
            size: 12,
        });
        
        // Merge all PDFs
        let successCount = 0;
        for (const pdfFile of pdfFiles) {
            console.log(`Merging: ${pdfFile}`);
            try {
                const pdfPath = path.join(outputDir, pdfFile);
                const pdfBytes = await fs.readFile(pdfPath);
                const pdf = await PDFDocument.load(pdfBytes);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
                successCount++;
            } catch (error) {
                console.error(`Error merging ${pdfFile}:`, error.message);
            }
        }
        
        console.log(`\nSuccessfully merged ${successCount} out of ${pdfFiles.length} PDFs`);
        
        // Save the merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        const outputPath = path.join(__dirname, 'klaviyo-documentation.pdf');
        await fs.writeFile(outputPath, mergedPdfBytes);
        
        console.log(`\n✅ Merged PDF saved as: ${outputPath}`);
        
        // Get file size
        const stats = await fs.stat(outputPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`📄 File size: ${fileSizeInMB} MB`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the merger
mergeTempPDFs();