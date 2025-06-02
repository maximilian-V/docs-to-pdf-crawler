const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF(url, pdfPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    await browser.close();
}

// List URLs to convert
const urls = [
    'https://developers.klaviyo.com/en/reference/api_overview',
    // Add additional pages here
];

(async () => {
    for (const url of urls) {
        const filename = url.split('/').pop() + '.pdf';
        const filepath = path.join(__dirname, filename);
        console.log(`Generating PDF for ${url}`);
        await generatePDF(url, filepath);
    }
})();
