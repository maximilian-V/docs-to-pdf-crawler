const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function mergePDFs(outputName = 'merged-documentation.pdf') {
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
        
        titlePage.drawText('Documentation', {
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
        for (let i = 0; i < pdfFiles.length; i++) {
            const pdfFile = pdfFiles[i];
            console.log(`[${i + 1}/${pdfFiles.length}] Merging: ${pdfFile}`);
            
            try {
                const pdfPath = path.join(outputDir, pdfFile);
                const pdfBytes = await fs.readFile(pdfPath);
                const pdf = await PDFDocument.load(pdfBytes);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                
                // Add separator page
                const separatorPage = mergedPdf.addPage();
                const { height: sepHeight } = separatorPage.getSize();
                
                separatorPage.drawText(pdfFile.replace('.pdf', '').replace(/_/g, ' '), {
                    x: 50,
                    y: sepHeight - 100,
                    size: 12,
                });
                
                // Add content pages
                pages.forEach(page => mergedPdf.addPage(page));
                successCount++;
                
            } catch (error) {
                console.error(`✗ Error merging ${pdfFile}:`, error.message);
            }
        }
        
        console.log(`\n✓ Successfully merged ${successCount} out of ${pdfFiles.length} PDFs`);
        
        // Save the merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        const outputPath = path.join(__dirname, outputName);
        await fs.writeFile(outputPath, mergedPdfBytes);
        
        console.log(`✅ Merged PDF saved as: ${outputPath}`);
        
        // Get file size
        const stats = await fs.stat(outputPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`📄 File size: ${fileSizeInMB} MB`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Get output name from command line argument
const outputName = process.argv[2] || 'merged-documentation.pdf';
mergePDFs(outputName);