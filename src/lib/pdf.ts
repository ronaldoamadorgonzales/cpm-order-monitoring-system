import fs from 'fs';
import path from 'path';

function escapePDFText(text: string | null | undefined): string {
  if (!text) return '';
  return text.toString().replace(/[\\()]/g, '\\$&');
}

export function generateInvoicePDF(order: any): string {
  const dir = path.join(process.cwd(), 'public', 'invoices');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filename = `invoice_${order.id}.pdf`;
  const filepath = path.join(dir, filename);

  const clientName = order.client.clientType === 'ORGANIZATION'
    ? order.client.organizationName
    : `${order.client.firstName} ${order.client.lastName}`;

  const venueName = 'Delivery Address';
  const address = order.customDeliveryAddress || '';

  // Escaping common variables
  const escapedClient = escapePDFText(clientName);
  const escapedVenue = escapePDFText(venueName);
  const escapedAddress = escapePDFText(address);
  const escapedService = escapePDFText(order.serviceType.serviceName);

  const formatTime = (timeVal: any) => {
    if (!timeVal) return 'N/A';
    if (typeof timeVal === 'string') {
      if (timeVal.includes(':')) {
        const parts = timeVal.split(':');
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      return timeVal;
    }
    const date = new Date(timeVal);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const ingressStr = formatTime(order.ingressTime);
  const egressStr = formatTime(order.egressTime);

  // We will loop through order.orderDays to render exactly one page per event day.
  const days = order.orderDays || [];
  const totalPages = days.length || 1;

  // Header template builder
  const buildHeader = (pageIndex: number, total: number) => {
    return [
      `BT`,
      `/F1 16 Tf`,
      `50 740 Td`,
      `\\(CPM ORDER MONITORING SYSTEM - INVOICE\\) Tj`,
      `/F1 10 Tf`,
      `320 0 Td`,
      `\\(Page ${pageIndex} of ${total}\\) Tj`,
      `-320 -25 Td`,
      `/F1 11 Tf`,
      `\\(Invoice Number: INV-2026-${order.id}\\) Tj`,
      `0 -18 Td`,
      `\\(Client: ${escapedClient}\\) Tj`,
      `0 -15 Td`,
      `\\(Delivery Address: ${escapedAddress}\\) Tj`,
      `0 -15 Td`,
      `\\(Service Type: ${escapedService}  |  Ingress: ${ingressStr}  |  Egress: ${egressStr}\\) Tj`,
      `0 -18 Td`,
      `\\(--------------------------------------------------------------------------\\) Tj`
    ];
  };

  const streams: string[] = [];

  if (days.length === 0) {
    // Fallback if no days are specified
    const textLines = [
      ...buildHeader(1, 1),
      `0 -30 Td`,
      `/F1 14 Tf`,
      `\\(No Event Days Scheduled for this order.\\) Tj`,
      `/F1 12 Tf`,
      `0 -30 Td`,
      `\\(Grand Total: PHP ${escapePDFText(order.grandTotal.toString())}\\) Tj`,
      `ET`
    ];
    streams.push(textLines.join('\n'));
  } else {
    // Loop through each event day and generate custom stream content (each represents one page)
    days.forEach((day: any, idx: number) => {
      const pageNum = idx + 1;
      const formattedDate = new Date(day.eventDate).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      const dayLines = [
        ...buildHeader(pageNum, totalPages),
        `0 -25 Td`,
        `/F1 13 Tf`,
        `\\(Event Day ${pageNum}: ${escapePDFText(formattedDate)}\\) Tj`,
        `0 -20 Td`,
        `/F1 11 Tf`
      ];

      let currentYOffset = 0;
      let daySubtotal = 0;

      // Loop through meal periods for this specific day
      const meals = day.mealPeriods || [];
      meals.forEach((meal: any) => {
        const menuTitle = `${meal.mealPeriod}: ${meal.customName || meal.menu?.title || 'Custom Combo'}`;
        const baseRate = Number(meal.rate || 0);
        const subtotal = baseRate * meal.pax;
        daySubtotal += subtotal;

        dayLines.push(`0 -20 Td`);
        dayLines.push(`\\(${escapePDFText(menuTitle)} \\(PHP ${baseRate.toFixed(2)}/pax\\)\\) Tj`);
        dayLines.push(`0 -15 Td`);
        dayLines.push(`\\(Allocated Pax: ${meal.pax}    |    Subtotal: PHP ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}\\) Tj`);
        
        const itemNames = meal.mealPeriodItems && meal.mealPeriodItems.length > 0
          ? meal.mealPeriodItems.map((i: any) => i.item?.itemName).filter(Boolean).join(', ')
          : (meal.menu?.menuItems?.map((i: any) => i.item?.itemName).filter(Boolean).join(', ') || 'N/A');
        dayLines.push(`0 -14 Td`);
        dayLines.push(`\\(Food Items: ${escapePDFText(itemNames || 'N/A')}\\) Tj`);
        currentYOffset -= 49;
      });

      dayLines.push(`0 -35 Td`);
      dayLines.push(`\\(--------------------------------------------------------------------------\\) Tj`);
      dayLines.push(`0 -25 Td`);
      dayLines.push(`/F1 12 Tf`);
      dayLines.push(`\\(Day Estimate: PHP ${daySubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}\\) Tj`);

      // If it's the last page, show the grand total cost of the invoice
      if (pageNum === totalPages) {
        dayLines.push(`0 -25 Td`);
        dayLines.push(`/F1 13 Tf`);
        dayLines.push(`\\(GRAND TOTAL COST: PHP ${escapePDFText(order.grandTotal.toString())}\\) Tj`);
      }

      dayLines.push(`0 -40 Td`);
      dayLines.push(`/F1 9 Tf`);
      dayLines.push(`\\(Thank you for your business!\\) Tj`);
      dayLines.push(`0 -12 Td`);
      dayLines.push(`\\(CPM Order Monitoring System - Invoice Document\\) Tj`);
      dayLines.push(`ET`);

      streams.push(dayLines.join('\n'));
    });
  }

  // -------------------------------------------------------------------
  // Assemble the multi-page PDF structure dynamically
  // -------------------------------------------------------------------
  const headerSection = `%PDF-1.4\n`;
  const catalogObjNum = 1;
  const pagesObjNum = 2;
  const fontObjNum = 3;

  // Font object
  const fontObjStr = `${fontObjNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  // We need to determine the object number offsets.
  // Catalog + Pages + Font = 3 objects.
  // Each page requires 2 objects: Page definition object & Stream content object.
  // Total objects = 3 + 2 * totalPages
  const kids: string[] = [];
  const pageObjects: string[] = [];
  const streamObjects: string[] = [];

  let nextObjNum = 4;
  streams.forEach((streamContent, idx) => {
    const pageObjNum = nextObjNum;
    const streamObjNum = nextObjNum + 1;
    kids.push(`${pageObjNum} 0 R`);

    const streamLength = Buffer.byteLength(streamContent, 'utf8');

    const pageObjStr = `${pageObjNum} 0 obj\n<< /Type /Page /Parent ${pagesObjNum} 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> /MediaBox [0 0 612 792] /Contents ${streamObjNum} 0 R >>\nendobj\n`;
    const streamObjStr = `${streamObjNum} 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;

    pageObjects.push(pageObjStr);
    streamObjects.push(streamObjStr);

    nextObjNum += 2;
  });

  const catalogObjStr = `${catalogObjNum} 0 obj\n<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>\nendobj\n`;
  const pagesObjStr = `${pagesObjNum} 0 obj\n<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${totalPages} >>\nendobj\n`;

  // Compute cumulative byte offsets for xref table
  const offsets: number[] = [];
  let currentOffset = Buffer.byteLength(headerSection, 'utf8');

  // Object 1: Catalog
  offsets.push(currentOffset);
  currentOffset += Buffer.byteLength(catalogObjStr, 'utf8');

  // Object 2: Pages
  offsets.push(currentOffset);
  currentOffset += Buffer.byteLength(pagesObjStr, 'utf8');

  // Object 3: Font
  offsets.push(currentOffset);
  currentOffset += Buffer.byteLength(fontObjStr, 'utf8');

  // Page and Stream objects
  for (let i = 0; i < totalPages; i++) {
    offsets.push(currentOffset);
    currentOffset += Buffer.byteLength(pageObjects[i], 'utf8');

    offsets.push(currentOffset);
    currentOffset += Buffer.byteLength(streamObjects[i], 'utf8');
  }

  // Concatenate PDF body
  const body = headerSection + 
               catalogObjStr + 
               pagesObjStr + 
               fontObjStr + 
               pageObjects.map((p, idx) => p + streamObjects[idx]).join('');

  const startxrefPos = Buffer.byteLength(body, 'utf8');

  // Xref table
  const pad = (n: number) => String(n).padStart(10, '0');
  const xrefLines = [
    `xref`,
    `0 ${nextObjNum}`,
    `0000000000 65535 f `
  ];

  offsets.forEach((off) => {
    xrefLines.push(`${pad(off)} 00000 n `);
  });

  const trailer = [
    `trailer`,
    `<< /Size ${nextObjNum} /Root ${catalogObjNum} 0 R >>`,
    `startxref`,
    `${startxrefPos}`,
    `%%EOF`
  ].join('\n');

  const pdfTemplate = body + xrefLines.join('\n') + '\n' + trailer;

  fs.writeFileSync(filepath, pdfTemplate, 'utf-8');
  return `/invoices/${filename}`;
}
