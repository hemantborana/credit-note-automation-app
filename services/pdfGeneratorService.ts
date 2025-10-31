import { CreditNoteData, CompanySettings } from '../types';

// These are imported from the global scope from index.html
declare const jspdf: any;

const { jsPDF } = jspdf;

// --- Helper function to convert number to Indian words ---
const convertToWords = (amount: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertHundreds = (num: number): string => {
        let result = '';
        if (num >= 100) {
            result += ones[Math.floor(num / 100)] + ' Hundred ';
            num %= 100;
        }
        if (num >= 20) {
            result += tens[Math.floor(num / 10)] + ' ';
            num %= 10;
        }
        if (num > 0) {
            result += ones[num];
        }
        return result.trim();
    };

    if (amount === 0) return "Zero";
    const rupees = Math.floor(amount);
    if (rupees === 0) return "";

    let words = "";
    if (rupees >= 10000000) {
        words += convertHundreds(Math.floor(rupees / 10000000)) + ' Crore ';
        // Recurse for the remainder
        const remainder = rupees % 10000000;
        if (remainder > 0) words += convertToWords(remainder);
    } else if (rupees >= 100000) {
        words += convertHundreds(Math.floor(rupees / 100000)) + ' Lakh ';
        const remainder = rupees % 100000;
        if (remainder > 0) words += convertToWords(remainder);
    } else if (rupees >= 1000) {
        words += convertHundreds(Math.floor(rupees / 1000)) + ' Thousand ';
        const remainder = rupees % 1000;
        if (remainder > 0) words += convertToWords(remainder);
    } else {
        words = convertHundreds(rupees);
    }
    
    return words.replace(/\s\s+/g, ' ').trim();
};

const getBase64FromUrl = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        // Check if the request was successful and the content is an image.
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
            console.warn(`Could not fetch logo from ${url} or it is not an image. Status: ${response.status}`);
            return null; // Return null to skip the logo
        }
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                resolve(String(reader.result));
            };
            reader.onerror = (error) => {
                console.error("FileReader failed to read blob:", error);
                resolve(null); // Return null on reader error
            };
        });
    } catch (error) {
        console.error("Network error while fetching logo:", error);
        return null; // Return null on network error
    }
};

const LOGO_URL = '/logo.png';
let logoBase64Cache: string | null = null;
let logoFetchAttempted = false; // Flag to ensure we only try to fetch once.


export const generatePdf = async (cnData: CreditNoteData, settings: CompanySettings, isPrinterCopy: boolean = false): Promise<string> => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // --- Watermark Logic ---
    // Only attempt to fetch the logo once per session.
    if (!logoFetchAttempted) {
        try {
            logoBase64Cache = await getBase64FromUrl(LOGO_URL);
        } catch (error) {
            console.error("An unexpected error occurred during logo fetch:", error);
            logoBase64Cache = null; // Ensure it's null on error
        } finally {
            logoFetchAttempted = true; // Mark that we've tried.
        }
    }
    
    // If the cached logo is a valid string, try to add it.
    if (logoBase64Cache) {
        try {
            const imgProps = doc.getImageProperties(logoBase64Cache);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();
            const imgWidth = 100;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;
            
            doc.saveGState();
            doc.setGState(new doc.GState({opacity: 0.08}));
            doc.addImage(logoBase64Cache, 'PNG', x, y, imgWidth, imgHeight);
            doc.restoreGState();
        } catch(e) {
            // This is a failsafe. If the base64 data is somehow corrupt, jsPDF might still throw.
            // We'll log the error and continue without the watermark.
            console.error("jsPDF failed to add the watermark image, skipping. Error:", e);
        }
    }


    const leftMargin = 18;
    const topMargin = 12;
    const contentWidth = 210 - leftMargin - leftMargin;
    let yPos = topMargin;

    // --- Header ---
    doc.setFont('Times', 'bold');
    doc.setFontSize(24);
    doc.text(settings.name.toUpperCase(), 105, yPos, { align: 'center' });
    yPos += 8;
    doc.setLineWidth(0.25);
    doc.line(leftMargin, yPos, leftMargin + contentWidth, yPos);
    yPos += 5;

    doc.setFont('Times', 'normal');
    doc.setFontSize(10);
    const addressLines = [
        settings.addressLine1,
        settings.addressLine2,
        settings.contactInfo
    ].filter(Boolean); // Filter out empty lines
    addressLines.forEach(line => {
        doc.text(line, 105, yPos, { align: 'center' });
        yPos += 4;
    });
    yPos += 1;
    doc.text(`GSTIN: ${settings.gstin} | UDYAM: ${settings.udyam} | State Code: ${settings.stateCode}`, 105, yPos, { align: 'center' });
    yPos += 4;
    doc.setLineWidth(0.25);
    doc.line(leftMargin, yPos, leftMargin + contentWidth, yPos);
    yPos += 6;

    // --- Title ---
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPos, leftMargin + contentWidth, yPos);
    yPos += 10; // Increased from 9 to 10 to add 4mm (0.4cm) of total space
    doc.setFont('Times', 'bold');
    doc.setFontSize(20);
    doc.text("CREDIT NOTE", 105, yPos, { align: 'center' });
    yPos += 8;
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPos, leftMargin + contentWidth, yPos);
    yPos += 8;

    // --- Info Section (Robust Implementation) ---
    const infoSectionStartY = yPos;
    doc.setFont('Times', 'normal');
    doc.setFontSize(10);

    const billToX = leftMargin;
    const detailsX = leftMargin + 105;
    const lineX = leftMargin + 99;
    const valueOffsetX = 32;

    // Column 1: Bill To
    doc.setFont('Times', 'bold');
    doc.text("BILL TO:", billToX, yPos);
    doc.setFont('Times', 'normal');
    doc.text(`M/s. ${cnData.party_name}`, billToX, yPos + 5);
    doc.text(cnData.party_address1, billToX, yPos + 10);
    doc.text(cnData.party_address2, billToX, yPos + 15);
    doc.text(cnData.party_city, billToX, yPos + 20);

    // Column 2: Details
    doc.setFont('Times', 'bold');
    doc.text("Credit Note No.:", detailsX, yPos);
    doc.setFont('Times', 'normal');
    doc.text(cnData.cn_number, detailsX + valueOffsetX, yPos, { align: 'left' });

    doc.setFont('Times', 'bold');
    doc.text("Date:", detailsX, yPos + 5);
    doc.setFont('Times', 'normal');
    doc.text(cnData.date, detailsX + valueOffsetX, yPos + 5, { align: 'left' });

    doc.setFont('Times', 'bold');
    doc.text("Scheme Period:", detailsX, yPos + 10);
    doc.setFont('Times', 'normal');
    doc.text(`${cnData.period_from} to ${cnData.period_to}`, detailsX + valueOffsetX, yPos + 10, { align: 'left' });

    doc.setFont('Times', 'bold');
    doc.text("Month:", detailsX, yPos + 15);
    doc.setFont('Times', 'normal');
    doc.text(cnData.month, detailsX + valueOffsetX, yPos + 15, { align: 'left' });
    
    yPos += 25;

    doc.setLineWidth(0.25);
    doc.line(lineX, infoSectionStartY - 2, lineX, yPos - 2);
    yPos += 8;
    
    doc.setFont('Times', 'bold');
    doc.setFontSize(12);
    doc.text("PURPOSE:", leftMargin, yPos);
    yPos += 5;
    doc.setFont('Times', 'normal');
    doc.setFontSize(10);
    doc.text(cnData.purpose, leftMargin, yPos, { maxWidth: contentWidth });
    yPos += 10;

    doc.setFont('Times', 'bold');
    doc.setFontSize(12);
    doc.text("CALCULATION DETAILS:", leftMargin, yPos);
    yPos += 5;
    
    const formatCurrency = (num: number) => `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatRoundOff = (num: number) => `Rs. ${num < 0 ? '' : '+'}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    (doc as any).autoTable({
        startY: yPos,
        body: [
            ["Net Sales Amount (Excluding GST)", { content: formatCurrency(cnData.net_sales), styles: { halign: 'right' } }],
            [`Credit Note @ ${cnData.cn_percentage}% on Net Sales Amount`, { content: formatCurrency(cnData.credit_amount), styles: { halign: 'right' } }],
            ["Round Off", { content: formatRoundOff(cnData.round_off), styles: { halign: 'right' } }],
            ["Final Credit Note Amount", { content: formatCurrency(cnData.final_amount), styles: { halign: 'right' } }],
        ],
        theme: 'grid',
        styles: { font: 'Times', fontSize: 10, cellPadding: { top: 3, right: 4, bottom: 3, left: 4 } },
        columnStyles: { 0: { cellWidth: 110 } },
        headStyles: {
            fillColor: '#ffffff',
            textColor: '#000000',
            lineWidth: 0
        },
        rowPageBreak: 'avoid',
        didParseCell: (data: any) => {
            if(data.row.index === 3) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = '#e0e0e0';
            }
        }
    });
    yPos = (doc as any).autoTable.previous.finalY + 8;

    doc.setFont('Times', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL CREDIT NOTE AMOUNT: ${formatCurrency(cnData.final_amount)}`, leftMargin, yPos);
    yPos += 8;

    doc.text("AMOUNT IN WORDS:", leftMargin, yPos);
    yPos += 5;
    doc.setFont('Times', 'normal');
    doc.setFontSize(10);
    const words = `Rupees ${convertToWords(cnData.final_amount)} Only`;
    doc.text(words, leftMargin, yPos, { maxWidth: contentWidth });
    yPos += 10;

    doc.setFont('Times', 'bold');
    doc.setFontSize(12);
    doc.text("TERMS & CONDITIONS:", leftMargin, yPos);
    yPos += 5;
    doc.setFont('Times', 'normal');
    doc.setFontSize(9);
    const terms = [
        "1. This Credit Note is non-refundable and cannot be exchanged for cash.",
        "2. The value can only be used for the adjustment of outstanding or future invoices.",
        "3. This Credit Note is issued exclusively to the party named herein and is non-transferable.",
        "4. Any discrepancies must be reported in writing within 7 business days of receipt.",
        "5. All disputes are subject to the exclusive jurisdiction of the courts in Goa.",
        "6. Kambeshwar Agencies reserves the right to amend these terms at its sole discretion.",
    ];
    terms.forEach(term => {
        doc.text(term, leftMargin, yPos);
        yPos += 4;
    });
    yPos = Math.max(yPos, 240); // Ensure footer has space

    const rightAlignX = leftMargin + contentWidth;
    doc.setFontSize(9);
    doc.text("Customer Acknowledgment:", leftMargin, yPos);
    doc.text(`For ${settings.name.toUpperCase()}:`, rightAlignX, yPos, { align: 'right' });
    yPos += 20;
    doc.text("Date: ___________________", leftMargin, yPos);

    if (!isPrinterCopy) {
        doc.setFont('Times', 'italic');
        doc.text("Digital Copy. Signature not required.", rightAlignX, yPos, { align: 'right' });
    }
    
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 10;
    doc.setLineWidth(0.25);
    doc.line(leftMargin, footerY - 4, leftMargin + contentWidth, footerY - 4);
    doc.setFont('Times', 'normal');
    doc.setFontSize(8);
    const generationTime = new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    doc.text(`This is a computer generated document. Generated on ${generationTime}`, 105, footerY, { align: 'center' });

    return doc.output('datauristring').split(',')[1];
};