import { PurchaseRequest } from '../types';
import { formatCurrency, formatDate } from './formatters';

export const exportToCSV = (requests: PurchaseRequest[], filename: string = 'purchase-requests') => {
  const headers = [
    'Request ID',
    'Requester Name',
    'Department',
    'Category',
    'Description',
    'Vendor',
    'Amount',
    'Status',
    'Urgency',
    'Budget Code',
    'Created Date',
    'Updated Date',
    'Expected Delivery',
    'Current Approver'
  ];

  const csvData = requests.map(request => [
    request.id,
    request.requesterName,
    request.department,
    request.category,
    `"${request.description.replace(/"/g, '""')}"`, // Escape quotes
    request.vendor,
    request.amount,
    request.status,
    request.urgency,
    request.budgetCode,
    formatDate(request.createdAt),
    formatDate(request.updatedAt),
    formatDate(request.expectedDelivery),
    request.currentApprover || 'N/A'
  ]);

  const csvContent = [headers, ...csvData]
    .map(row => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToPDF = (requests: PurchaseRequest[], title: string = 'Purchase Requests Report') => {
  // This would integrate with a PDF library like jsPDF in a real application
  // For now, we'll create a printable HTML version
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { margin-bottom: 20px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="summary">
        <p><strong>Total Requests:</strong> ${requests.length}</p>
        <p><strong>Total Value:</strong> ${formatCurrency(requests.reduce((sum, req) => sum + req.amount, 0))}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Requester</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${requests.map(request => `
            <tr>
              <td>${request.id}</td>
              <td>${request.requesterName}</td>
              <td>${request.description}</td>
              <td>${formatCurrency(request.amount)}</td>
              <td>${request.status.replace('_', ' ')}</td>
              <td>${formatDate(request.createdAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};