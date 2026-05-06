import * as Print from 'expo-print';

export type InvoiceOrder = {
  id: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  status: string;
  placedAt: string;
  trackingNumber: string;
  shipping?: { name: string; days?: string };
  address?: {
    fullName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function buildHTML(order: InvoiceOrder, userEmail?: string): string {
  const addr = order.address;
  const addrLine1 = addr ? addr.address1 + (addr.address2 ? `, ${addr.address2}` : '') : '';
  const addrLine2 = addr ? `${addr.city}, ${addr.state} ${addr.zip}` : '';
  const addrLine3 = addr?.country ?? '';

  const itemRows = order.items.map((item) => `
    <tr>
      <td class="name">${item.name}</td>
      <td class="c">${item.quantity}</td>
      <td class="r">$${item.price.toFixed(2)}</td>
      <td class="r amt">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  @page { size: A4 portrait; margin: 0; }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #1E293B;
    background: #fff;
    font-size: 11px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 794px;
    min-height: 1123px;
    margin: 0 auto;
    background: #fff;
    display: flex;
    flex-direction: column;
  }

  /* HEADER */
  .header {
    background: #1A56DB;
    padding: 22px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }
  .brand-name {
    font-size: 26px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
    line-height: 1;
  }
  .brand-sub {
    font-size: 9px;
    font-weight: 700;
    color: rgba(255,255,255,0.55);
    letter-spacing: 2.5px;
    text-transform: uppercase;
    margin-top: 4px;
  }
  .header-right { text-align: right; }
  .inv-label {
    font-size: 9px;
    font-weight: 700;
    color: rgba(255,255,255,0.55);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .inv-number {
    font-size: 17px;
    font-weight: 800;
    color: #fff;
    font-family: 'Courier New', Courier, monospace;
  }
  .inv-date {
    font-size: 10px;
    color: rgba(255,255,255,0.65);
    margin-top: 3px;
  }
  .paid-stamp {
    display: inline-block;
    background: #fff;
    color: #16A34A;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 4px;
    margin-top: 8px;
    border: 1.5px solid rgba(255,255,255,0.8);
  }

  /* DIVIDER */
  .blue-rule { height: 3px; background: #1A56DB; flex-shrink: 0; }
  .thin-rule { height: 1px; background: #E2E8F0; }

  /* INFO BAND */
  .info-band {
    display: flex;
    padding: 18px 40px;
    gap: 24px;
    border-bottom: 1px solid #E2E8F0;
    flex-shrink: 0;
  }
  .bill-col { flex: 1.4; padding-right: 24px; border-right: 1px solid #E2E8F0; }
  .meta-col { flex: 2; padding-left: 24px; }

  .col-label {
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.8px;
    color: #1A56DB;
    margin-bottom: 8px;
  }
  .bill-name { font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 3px; }
  .bill-line { font-size: 11px; color: #64748B; line-height: 1.65; }

  .meta-grid { display: flex; gap: 0; }
  .meta-item { flex: 1; }
  .meta-item + .meta-item { padding-left: 20px; border-left: 1px solid #F1F5F9; }
  .meta-lbl {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #94A3B8;
    margin-bottom: 4px;
  }
  .meta-lbl + .meta-lbl { margin-top: 12px; }
  .meta-val { font-size: 12px; font-weight: 600; color: #1E293B; }
  .meta-val.green { color: #16A34A; }
  .meta-val.blue  { color: #1A56DB; }

  /* ITEMS TABLE */
  .items-section { padding: 16px 40px 0; flex-shrink: 0; }
  .section-label {
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.8px;
    color: #1A56DB;
    margin-bottom: 8px;
  }

  table { width: 100%; border-collapse: collapse; border: 1px solid #E2E8F0; border-radius: 5px; overflow: hidden; }
  thead tr { background: #1A56DB; }
  th {
    padding: 9px 12px;
    text-align: left;
    font-size: 9px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border: none;
  }
  th.r { text-align: right; }
  th.c { text-align: center; }

  tbody tr { border-top: 1px solid #E2E8F0; }
  tbody tr:nth-child(even) { background: #F8FAFC; }
  tbody tr:nth-child(odd)  { background: #fff; }

  td {
    padding: 9px 12px;
    font-size: 11px;
    color: #475569;
    vertical-align: middle;
  }
  td.r   { text-align: right; }
  td.c   { text-align: center; }
  td.name { font-weight: 600; color: #1E293B; max-width: 320px; }
  td.amt  { font-weight: 700; color: #1E293B; }

  /* TOTALS */
  .totals-section {
    display: flex;
    justify-content: flex-end;
    padding: 14px 40px 16px;
    flex-shrink: 0;
  }
  .totals-box { width: 220px; }
  .t-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    font-size: 11px;
    color: #64748B;
    border-bottom: 1px solid #F1F5F9;
  }
  .t-row:last-child { border-bottom: none; }
  .t-row.grand {
    border-top: 2px solid #1A56DB;
    border-bottom: none;
    padding-top: 10px;
    margin-top: 4px;
    font-size: 14px;
    font-weight: 800;
    color: #1E293B;
  }
  .t-amt { font-weight: 600; color: #475569; }
  .t-row.grand .t-amt { color: #1A56DB; font-weight: 800; }

  /* TRACKING BAR */
  .tracking {
    margin: 0 40px 16px;
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: 6px;
    padding: 10px 18px;
    display: flex;
    gap: 36px;
    flex-shrink: 0;
  }
  .trk-label {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #3B82F6;
    margin-bottom: 3px;
  }
  .trk-val {
    font-size: 11px;
    font-weight: 700;
    color: #1E293B;
    font-family: 'Courier New', Courier, monospace;
  }

  /* SPACER pushes footer to bottom */
  .spacer { flex: 1; }

  /* FOOTER */
  .footer {
    border-top: 2px solid #1A56DB;
    padding: 14px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #F8FAFC;
    flex-shrink: 0;
  }
  .footer-msg { font-size: 12px; font-weight: 700; color: #1E293B; }
  .footer-contact { font-size: 10px; color: #64748B; text-align: right; line-height: 1.7; }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="brand-name">PLENTYCART</div>
      <div class="brand-sub">E-Commerce</div>
    </div>
    <div class="header-right">
      <div class="inv-label">Invoice</div>
      <div class="inv-number">${order.id}</div>
      <div class="inv-date">${fmt(order.placedAt)}</div>
      <div class="paid-stamp">PAID</div>
    </div>
  </div>

  <!-- BILL TO + META -->
  <div class="info-band">
    <div class="bill-col">
      <div class="col-label">Bill To</div>
      <div class="bill-name">${addr?.fullName ?? 'Customer'}</div>
      ${userEmail ? `<div class="bill-line">${userEmail}</div>` : ''}
      ${addrLine1 ? `<div class="bill-line">${addrLine1}</div>` : ''}
      ${addrLine2 ? `<div class="bill-line">${addrLine2}</div>` : ''}
      ${addrLine3 ? `<div class="bill-line">${addrLine3}</div>` : ''}
    </div>
    <div class="meta-col">
      <div class="col-label">Order Details</div>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-lbl">Invoice Date</div>
          <div class="meta-val">${fmt(order.placedAt)}</div>
          <div class="meta-lbl">Payment</div>
          <div class="meta-val green">Paid in Full</div>
        </div>
        <div class="meta-item">
          <div class="meta-lbl">Shipping Method</div>
          <div class="meta-val">${order.shipping?.name ?? 'Standard Ground'}</div>
          <div class="meta-lbl">Order Status</div>
          <div class="meta-val blue">${order.status}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ITEMS -->
  <div class="items-section">
    <div class="section-label">Order Items</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="c">Qty</th>
          <th class="r">Unit Price</th>
          <th class="r">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
  </div>

  <!-- TOTALS -->
  <div class="totals-section">
    <div class="totals-box">
      <div class="t-row">
        <span>Subtotal</span>
        <span class="t-amt">$${order.subtotal.toFixed(2)}</span>
      </div>
      <div class="t-row">
        <span>Shipping (${order.shipping?.name ?? 'Standard'})</span>
        <span class="t-amt">$${order.shippingCost.toFixed(2)}</span>
      </div>
      <div class="t-row">
        <span>Tax (8%)</span>
        <span class="t-amt">$${order.tax.toFixed(2)}</span>
      </div>
      <div class="t-row grand">
        <span>Total Charged</span>
        <span class="t-amt">$${order.total.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- TRACKING -->
  <div class="tracking">
    <div>
      <div class="trk-label">Order ID</div>
      <div class="trk-val">${order.id}</div>
    </div>
    <div>
      <div class="trk-label">Tracking Number</div>
      <div class="trk-val">${order.trackingNumber}</div>
    </div>
    <div>
      <div class="trk-label">Order Date</div>
      <div class="trk-val">${fmt(order.placedAt)}</div>
    </div>
  </div>

  <div class="spacer"></div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-msg">Thank you for shopping with Plentycart!</div>
    <div class="footer-contact">
      support@plentycart.com<br/>plentycart.com
    </div>
  </div>

</div>
</body>
</html>`;
}

export async function generateInvoicePDF(order: InvoiceOrder, userEmail?: string): Promise<string> {
  const html = buildHTML(order, userEmail);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}
