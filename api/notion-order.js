/* ============================================================
   POST /api/notion-order
   Creates an order entry in the Notion Orders database
   when a customer places an order on the website.
   ============================================================ */

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const NOTION_KEY = process.env.NOTION_API_KEY;
  const ORDERS_DB = process.env.NOTION_ORDERS_DB;

  if (!NOTION_KEY || !ORDERS_DB) {
    console.warn('Notion not configured — skipping order sync');
    return res.status(200).json({ success: false, reason: 'not_configured' });
  }

  try {
    const { orderId, customer, items, subtotal, total, discount, deliveryDate } = req.body || {};

    if (!orderId || !customer) {
      return res.status(400).json({ error: 'Missing order data' });
    }

    // Build the items summary text
    const itemsSummary = (items || [])
      .map(i => `${i.name} × ${i.qty}`)
      .join(', ');

    const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    const orderName = `${orderId} — ${customerName}`;

    // Build Notion page properties
    const properties = {
      'Order Name': {
        title: [{ text: { content: orderName } }],
      },
      'Customer': {
        rich_text: [{ text: { content: customerName } }],
      },
      'Status': {
        select: { name: 'new' },
      },
      'Total Price ': {
        number: total || subtotal || 0,
      },
    };

    // Add phone if available
    if (customer.phone) {
      properties['Phone'] = {
        phone_number: customer.phone,
      };
    }

    // Add delivery date if available
    if (deliveryDate) {
      properties['Delivery Date '] = {
        date: { start: deliveryDate },
      };
    }

    // Add quantity (total items)
    const totalQty = (items || []).reduce((sum, i) => sum + (i.qty || 0), 0);
    if (totalQty > 0) {
      properties['Quantity (Dozens)\t'] = {
        number: totalQty,
      };
    }

    // Add paid status (always unchecked for new orders)
    properties['Paid'] = {
      checkbox: false,
    };

    // Build notes content
    const notesParts = [];
    if (customer.company) notesParts.push(`Company: ${customer.company}`);
    if (customer.address) notesParts.push(`Address: ${customer.address}`);
    if (customer.city) notesParts.push(`City: ${customer.city}`);
    if (customer.notes) notesParts.push(`Notes: ${customer.notes}`);
    if (itemsSummary) notesParts.push(`Items: ${itemsSummary}`);
    if (discount) notesParts.push(`Discount: ${discount.code} (${discount.percent}% off, -$${discount.amount})`);
    if (customer.email) notesParts.push(`Email: ${customer.email}`);

    if (notesParts.length > 0) {
      properties['Notes'] = {
        rich_text: [{ text: { content: notesParts.join('\n') } }],
      };
    }

    // Create the page in Notion
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: ORDERS_DB },
        properties,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Notion API error:', response.status, errBody);
      return res.status(200).json({ success: false, reason: 'notion_error' });
    }

    const result = await response.json();
    return res.status(200).json({ success: true, notionPageId: result.id });

  } catch (err) {
    console.error('Notion order sync error:', err);
    return res.status(200).json({ success: false, reason: 'exception' });
  }
};
