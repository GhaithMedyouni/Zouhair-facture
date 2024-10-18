const Invoice = require('../models/appmodel/Invoice');
const PDFDocument = require('pdfkit');
const Company = require('../models/coreModel/EntrepriseSetting');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const mongoose = require('mongoose');
const { DiffieHellmanGroup } = require('crypto');
const multer = require('multer');
// Setup storage and filename for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/invoices'); // Directory to store uploaded files
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`); // Unique file name
  }
});

// Filter for image file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and JPEG are allowed.'), false);
  }
};

// Multer setup
 exports.uploadFac = multer({
  storage: storage,
 // Limit size to 5MB
});

// Create Invoice

// Assuming you have the upload middleware already set up

exports.createInvoice = async (req, res) => {
  try {
    const { client, number, year, currency, status, type, date, note, items, subtotal, tax, taxAmount, total, paidAmount, createdBy } = req.body;

    // Check if an invoice with the same number and year already exists
    const existingInvoice = await Invoice.findOne({ number, year });
    if (existingInvoice) {
      return res.status(400).json({ message: 'Invoice number already exists for this year.' });
    }

    // Get facture image if uploaded
    let factureImagePath = null;
    if (req.file) {
      factureImagePath = req.file.path; // This will give you the path to the uploaded file
    }

    // Create a new invoice
    const newInvoice = new Invoice({
      client,
      number,
      year,
      currency,
      status,
      type,
      date,
      note,
      items,
      subtotal,
      tax,
      taxAmount,
      total,
      paidAmount,
      createdBy,
      factureImage: factureImagePath // Save the image path in the invoice
    });

    // Save the new invoice in the database
    await newInvoice.save();

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error("Error creating invoice:", error); // Log error details
    res.status(500).json({ message: 'Error creating invoice', error: error.message });
  }
};


// Expose the upload middleware with route handler


// Get all invoices (with optional filtering by type and status)
exports.getInvoices = async (req, res) => {
  try {
    const { type, status } = req.query; // Query parameters for filtering by type and status
    const { createdBy } = req.params;   // Get createdBy from the request parameters

    // Initialize filter object
    let filter = {};

    // Add filters based on query params
    if (type) {
      filter.type = type; // Filter by 'Standard' or 'Proforma'
    }

    if (status) {
      filter.status = status; // Optionally filter by invoice status
    }

    // Add filter for createdBy if present in the request params
    if (createdBy) {
      filter.createdBy = createdBy; // Filter by the creator's ID
    }

    // Find invoices with applied filters and populate references
    const invoices = await Invoice.find(filter)
      .populate('client')
      .populate('currency')
      .populate('tax');

    // Return the filtered invoices in the response
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error });
  }
};

// Get a single invoice by its ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;  // Get the invoice ID from the request parameters

    // Find the invoice by ID and populate related fields (client, currency, tax)
    const invoice = await Invoice.findById(id)
      .populate('client')
      .populate('currency')
      .populate('tax');

    // If the invoice is not found, return a 404 error
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Return the invoice details in the response
    res.status(200).json(invoice);
  } catch (error) {
    // Handle any errors that occur during the query
    res.status(500).json({ message: 'Error fetching invoice', error });
  }
};

// Convert Proforma to Facture

exports.convertProformaToFacture = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the Proforma invoice
    const proformaInvoice = await Invoice.findById(id);
    if (!proformaInvoice) {
      return res.status(404).json({ message: 'Proforma invoice not found' });
    }

    if (proformaInvoice.type !== 'Proforma') {
      return res.status(400).json({ message: 'This invoice is not a Proforma invoice or has already been converted.' });
    }

    // Update the Proforma invoice to mark it as converted
    proformaInvoice.isConverted = true;
    await proformaInvoice.save();

    // Remove system-generated fields that should not be copied over
   // const { _id, type, isConverted, createdAt, updatedAt, ...rest } = proformaInvoice.toObject();

    // Create a new Facture invoice with the same details
    const factureInvoice = new Invoice({
      ...proformaInvoice.toObject(), // Copy over the remaining fields
      _id: new mongoose.Types.ObjectId(), // Generate a new ObjectId for the new invoice
      type: 'Standard', // Change the type to Standard (Facture)
      isConverted: false, // Reset the isConverted field for the new invoice
    });

    await factureInvoice.save();

    res.status(201).json({ message: 'Proforma invoice converted to Facture successfully', factureInvoice });

  } catch (error) {
    console.error('Error converting Proforma invoice to Facture:', error);
    res.status(500).json({ message: 'Error converting Proforma invoice to Facture', error });
  }
};


// Update Invoice
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Log the received ID
    console.log(`Received ID: ${id}`);

    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid invoice ID format' });
    }

    const { number, year } = req.body;

    // Check if an invoice with the same number and year exists, excluding the current one
    const existingInvoice = await Invoice.findOne({ number, year, _id: { $ne: id } });
    if (existingInvoice) {
      return res.status(400).json({ message: 'Invoice number already exists for this year.' });
    }

    // Find the current invoice before updating
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Handle file upload if a new factureImage is provided
    if (req.file) {
      req.body.factureImage = req.file.path;
      // Save the new image path to the invoice data
    }

    // Update the invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found after update' });
    }

    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice: ", error);
    res.status(500).json({ message: 'Error updating invoice', error });
  }
};

// Delete Invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedInvoice = await Invoice.findByIdAndDelete(id);
    if (!deletedInvoice) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting invoice', error });
  }
};

// Function to update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid } = req.body; // The amount that has been paid

    // Find the invoice by ID
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Update the paidAmount
    invoice.paidAmount += amountPaid;

    // Determine the payment status
    if (invoice.paidAmount >= invoice.total) {
      invoice.paymentStatus = 'Paid';
      invoice.paidAmount = invoice.total; // Ensure that paidAmount doesn't exceed the total
    } else if (invoice.paidAmount > 0 && invoice.paidAmount < invoice.total) {
      invoice.paymentStatus = 'Partially Paid';
    } else {
      invoice.paymentStatus = 'Unpaid';
    }

    await invoice.save();

    res.status(200).json({ message: 'Payment status updated', invoice });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status', error });
  }
};



// Function to generate an invoice PDF with dynamic company and invoice information

exports.generateInvoicePDF = async (req, res) => {
  
  const { id, createdBy } = req.params;

  try {
    // Fetch company details using createdBy
    const company = await Company.findOne({ createdBy });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Fetch invoice details using id
    const invoice = await Invoice.findById(id).populate('client').populate('currency').populate('tax');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Handle Proforma type with factureImage
    if (invoice.type === 'Proforma' && invoice.factureImage) {
      const imagePath = path.join(__dirname, '../', invoice.factureImage);

      // Set the custom file name for the download
      let customFileName = `invoice-${invoice.number}.pdf`;

      if (invoice.client.person != null) {
        customFileName = `invoice-${invoice.client.person.nom}-${invoice.client.person.prenom}-${invoice.number}.pdf`;
      } else if (invoice.client.entreprise != null) {
        customFileName = `invoice-${invoice.client.entreprise.nom}-${invoice.number}.pdf`;
      }
      // Add the company logo


      // Check if the factureImage file exists
      if (fs.existsSync(imagePath)) {
        // Check if the file is already a PDF
        if (path.extname(imagePath).toLowerCase() === '.pdf') {
          // If the file is already a PDF, send it directly as a download
          return res.download(imagePath, customFileName, (err) => {
            if (err) {
              if (!res.headersSent) {
                return res.status(500).json({ message: 'Error downloading facture image', error: err });
              }
            }
          });
        } else {
          // If the file is not a PDF, create a PDF with the image
          const doc = new PDFDocument();
          const pdfPath = path.join(__dirname, '../', `converted-${invoice.number}.pdf`);

          // Stream the PDF to the file system
          const writeStream = fs.createWriteStream(pdfPath);
          doc.pipe(writeStream);

          // Add the image to the PDF
          doc.image(imagePath, {
            fit: [500, 500], // Resize the image to fit within the PDF
            align: 'center',
            valign: 'center',
          });

       

          // Finalize the PDF and end the stream
          doc.end();

          // Wait for the PDF to finish writing before downloading
          writeStream.on('finish', () => {
            // Send the generated PDF as a download
            return res.download(pdfPath, customFileName, (err) => {
              if (err) {
                if (!res.headersSent) {
                  return res.status(500).json({ message: 'Error downloading converted PDF', error: err });
                }
              }

              // Optionally delete the generated PDF after download
              fs.unlink(pdfPath, (unlinkErr) => {
                if (unlinkErr) {
                  console.error('Error deleting temporary PDF:', unlinkErr);
                }
              });
            });
          });
        }
      } else {
        if (!res.headersSent) {
          return res.status(404).json({ message: 'Facture image not found' });
        }
      }
    } else {
      // Handle normal PDF generation for non-Proforma invoices
      const doc = new PDFDocument({ margin: 50 });

      // Set the response to download the PDF
      res.setHeader('Content-disposition', `attachment; filename=invoice-${invoice.number}.pdf`);
      res.setHeader('Content-type', 'application/pdf');

      if (invoice.client.person != null) {
        res.setHeader('Content-disposition', `attachment; filename=invoice-${invoice.client.person.nom}-${invoice.client.person.prenom}-${invoice.number}.pdf`);
      }
      if (invoice.client.entreprise != null) {
        res.setHeader('Content-disposition', `attachment; filename=invoice-${invoice.client.entreprise.nom}-${invoice.number}.pdf`);
      }
      if (company.logo!==null) {
        doc.image(company.logo, 50, 45, { width: 100 });
      } else {
        doc.text('Logo Placeholder', 50, 45, { width: 100 });
      }
  
      // Pipe the PDF into the response
      doc.pipe(res);

      // Add company information
      doc.fontSize(20).text(company.name.toUpperCase(), 160, 57).moveDown();
      doc.fontSize(10)
        .text(company.address, 200, 65, { align: 'right' })
        .text(company.state, 200, 80, { align: 'right' })
        .text(company.country, 200, 95, { align: 'right' });

      // Add invoice title
      doc.fontSize(20).fillColor('#5F259F').text('Facture', 50, 160);

      // Add invoice details
      doc.fontSize(10).fillColor('black')
        .text(`Date : ${invoice.date.toLocaleDateString()}`, 50, 200)
        .text(`Numéro : # ${invoice.number}/${invoice.year}`, 50, 230)
        .moveDown();

      if (invoice.client.person != null) {
        doc.text(`Nom du client : ${invoice.client.person.nom} ${invoice.client.person.prenom} `, 200, 220, { align: 'right' });
      }
      if (invoice.client.entreprise != null) {
        doc.text(`Nom du client : ${invoice.client.entreprise.nom}`, 200, 220, { align: 'right' });
      }

      // Add table headers
      doc.moveDown().fillColor('#5F259F').fontSize(12)
        .text('Article', 50, 270)
        .text('Quantité', 100, 270, { align: 'center' })
        .text('Prix', 250, 270, { align: 'center' })
        .text('Total', 400, 270, { align: 'center' })
        .moveTo(50, 285).lineTo(550, 285).stroke();

      // Add items
      let yPosition = 300;
      invoice.items.forEach(item => {
        doc.fillColor('black').fontSize(10)
          .text(item.article, 50, yPosition)
          .text(item.quantity, 100, yPosition, { align: 'center' })
          .text(` ${item.price.toFixed(2)} ${invoice.currency.symbol}`, 250, yPosition, { align: 'center' })
          .text(` ${item.total.toFixed(2)} ${invoice.currency.symbol}`, 400, yPosition, { align: 'center' });

        yPosition += 20;
      });

      // Add subtotal, tax, and total
      doc.fontSize(10).fillColor('black');

      // Subtotal
      doc.text('Sous-total :', 350, yPosition, { align: 'left' });
      doc.text(` ${invoice.subtotal.toFixed(2)} ${invoice.currency.symbol}`, 450, yPosition, { align: 'right' });

      // Tax
      yPosition += 15; // Adjust yPosition to move down for the next line
      doc.text(`Tax ${invoice.tax.name} (${invoice.tax.value}%) :`, 350, yPosition, { align: 'left' });
      doc.text(` ${invoice.taxAmount.toFixed(2)} ${invoice.currency.symbol}`, 450, yPosition, { align: 'right' });

      // Total
      yPosition += 15; // Adjust yPosition to move down for the next line
      doc.text('Total :', 350, yPosition, { align: 'left' });
      doc.text(` ${invoice.total.toFixed(2)} ${invoice.currency.symbol}`, 450, yPosition, { align: 'right' });

      // Add footer
      doc.moveDown().fontSize(10).fillColor('gray')
        .text('Invoice was created on a computer and is valid without the signature and seal', 50, yPosition + 60, { align: 'center', width: 500 });

      // Finalize the PDF and end the stream
      doc.end();
    }
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Error generating PDF', error });
    }
  }
};




// Helper function to generate a PDF for non-Proforma invoices
const generatePDF = (invoice, company) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // Add company information
    doc.fontSize(20).text(company.name.toUpperCase(), 160, 57).moveDown();
    doc.fontSize(10)
      .text(company.address, 200, 65, { align: 'right' })
      .text(company.state, 200, 80, { align: 'right' })
      .text(company.country, 200, 95, { align: 'right' });

    // Add invoice title
    doc.fontSize(20).fillColor('#5F259F').text('Facture', 50, 160);

    // Add invoice details
    doc.fontSize(10).fillColor('black')
      .text(`Date : ${invoice.date.toLocaleDateString()}`, 50, 200)
      .text(`Numéro : # ${invoice.number}/${invoice.year}`, 50, 230)
      .moveDown();

    // Add client information
    if (invoice.client.person) {
      doc.text(`Nom du client : ${invoice.client.person.nom} ${invoice.client.person.prenom}`, 200, 220, { align: 'right' });
    } else if (invoice.client.entreprise) {
      doc.text(`Nom du client : ${invoice.client.entreprise.nom}`, 200, 220, { align: 'right' });
    }
// Add the company logo
if (company.logo!==null) {
  doc.image(company.logo, 50, 45, { width: 100 });
} else {
  doc.text('Logo Placeholder', 50, 45, { width: 100 });
}

    // Add table headers
    doc.moveDown().fillColor('#5F259F').fontSize(12)
      .text('Article', 50, 270)
      .text('Quantité', 100, 270, { align: 'center' })
      .text('Prix', 250, 270, { align: 'center' })
      .text('Total', 400, 270, { align: 'center' })
      .moveTo(50, 285).lineTo(550, 285).stroke();

    // Add items
    let yPosition = 300;
    invoice.items.forEach(item => {
      doc.fillColor('black').fontSize(10)
        .text(item.article, 50, yPosition)
        .text(item.quantity, 100, yPosition, { align: 'center' })
        .text(` ${item.price.toFixed(2)} ${invoice.currency.symbol}`, 250, yPosition, { align: 'center' })
        .text(` ${item.total.toFixed(2)} ${invoice.currency.symbol}`, 400, yPosition, { align: 'center' });
      yPosition += 20;
    });

    // Add subtotal, tax, and total
    doc.fontSize(10).fillColor('black');
    doc.text('Sous-total :', 350, yPosition, { align: 'left' });
    doc.text(` ${invoice.subtotal.toFixed(2)} ${invoice.currency.symbol}`, 450, yPosition, { align: 'right' });

    yPosition += 15;
    doc.text(`Tax ${invoice.tax.name} (${invoice.tax.value}%) :`, 350, yPosition, { align: 'left' });
    doc.text(` ${invoice.taxAmount.toFixed(2)} ${invoice.currency.symbol}`, 450, yPosition, { align: 'right' });

    yPosition += 15;
    doc.text('Total :', 350, yPosition, { align: 'left' });
    doc.text(` ${invoice.total.toFixed(2)} ${invoice.currency.symbol}`, 450, yPosition, { align: 'right' });

    // Add footer
    doc.moveDown().fontSize(10).fillColor('gray')
      .text('Invoice was created on a computer and is valid without the signature and seal', 50, yPosition + 60, { align: 'center', width: 500 });

    // Finalize the PDF and end the stream
    doc.end();
  });
};

// Helper function to handle Proforma invoices with factureImage
const handleProformaInvoice = async (invoice) => {
  const imagePath = path.join(__dirname, '../', invoice.factureImage);
  return new Promise((resolve, reject) => {
    if (fs.existsSync(imagePath)) {
      const buffers = [];
      const doc = new PDFDocument();

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // If the factureImage is a PDF, embed it
      if (path.extname(imagePath).toLowerCase() === '.pdf') {
        const pdfBuffer = fs.readFileSync(imagePath);
        doc.addPage({ buffer: pdfBuffer });
      } else {
        // If the factureImage is an image (e.g., JPG, PNG), embed it into a PDF
        doc.image(imagePath, { fit: [500, 500], align: 'center', valign: 'center' });
        doc.text(`Invoice Number: ${invoice.number}`, { align: 'center' });

        if (invoice.client.person) {
          doc.text(`Client: ${invoice.client.person.nom} ${invoice.client.person.prenom}`, { align: 'center' });
        } else if (invoice.client.entreprise) {
          doc.text(`Client: ${invoice.client.entreprise.nom}`, { align: 'center' });
        }
      }
      doc.end();
    } else {
      reject(new Error('Facture image not found'));
    }
  });
};

// Main function to generate multiple invoices in a zip file
exports.generateMultipleInvoicesZip = async (req, res) => {
  const { invoiceIds, createdBy } = req.query;

  if (!invoiceIds || !createdBy) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const invoiceIdsArray = invoiceIds.split(',');

  try {
    // Fetch company details using createdBy
    const company = await Company.findOne({ createdBy });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Create a zip archive
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Set the response headers for the zip file
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.zip');
    res.setHeader('Content-Type', 'application/zip');

    // Pipe the archive into the response
    archive.pipe(res);

    // Loop through the provided invoice IDs and generate a PDF for each one
    for (const id of invoiceIdsArray) {
      const invoice = await Invoice.findById(id).populate('client').populate('currency').populate('tax');
      if (!invoice) {
        console.log(`Invoice not found: ${id}`);
        continue;
      }

      let pdfBuffer = null;

      if (invoice.type === 'Proforma' && invoice.factureImage) {
        // Handle Proforma invoice with factureImage
        pdfBuffer = await handleProformaInvoice(invoice);
      } else {
        // Generate a PDF for non-Proforma invoices
        pdfBuffer = await generatePDF(invoice, company);
      }

      // Set the file name dynamically based on the client's information
      let filename = `invoice-${invoice.number}.pdf`;
      if (invoice.client.person) {
        filename = `invoice-${invoice.client.person.nom}-${invoice.client.person.prenom}-${invoice.number}.pdf`;
      } else if (invoice.client.entreprise) {
        filename = `invoice-${invoice.client.entreprise.nom}-${invoice.number}.pdf`;
      }

      // Append the PDF buffer to the zip archive
      archive.append(pdfBuffer, { name: filename });
    }

    // Finalize the zip archive after adding all PDFs
    archive.finalize();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating invoices', error });
  }
};







//send invoice par email
exports.generateInvoicePDFandSendEmail = async (req, res) => {
  const { id, createdBy } = req.params;
  try {
    // Fetch company details using createdBy
    const company = await Company.findOne({ createdBy });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Fetch invoice details using id
    const invoice = await Invoice.findById(id).populate('client').populate('currency').populate('tax');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Define the file path where the PDF will be temporarily saved
    let pdfFileName = `invoice-${invoice.number}.pdf`;
    if (invoice.client.person != null) {
      pdfFileName = `invoice-${invoice.client.person.nom}-${invoice.client.person.prenom}-${invoice.number}.pdf`;
    } else if (invoice.client.entreprise != null) {
      pdfFileName = `invoice-${invoice.client.entreprise.nom}-${invoice.number}.pdf`;
    }
    const pdfPath = path.join('Invoices', pdfFileName);
    console.log('PDF Path:', pdfPath); // Log PDF path

    // Create a new PDF document and save it to the file system
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(pdfPath));

    // // Add the company logo
    // if (company.logo !== null) {
    //   doc.image(company.logo, 50, 45, { width: 100 });
    // } else {
    //   doc.text('Logo Placeholder', 50, 45, { width: 100 });
    // }

    // Add company information
    doc.fontSize(20).text(company.name.toUpperCase(), 160, 57).moveDown();
    doc.fontSize(10)
      .text(company.address, 200, 65, { align: 'right' })
      .text(company.state, 200, 80, { align: 'right' })
      .text(company.country, 200, 95, { align: 'right' });

    // Add invoice title
    doc.fontSize(20).fillColor('#5F259F').text('Facture', 50, 160);

    // Add invoice details
    doc.fontSize(10).fillColor('black')
      .text(`Date : ${invoice.date.toLocaleDateString()}`, 50, 200)
      .text(`Numéro : # ${invoice.number}/${invoice.year}`, 50, 230)
      .moveDown();

    doc.text(`Client type : ${invoice.client.type}`, 200, 200, { align: 'right' });
    if (invoice.client.person != null) {
      doc.text(`Client Name : ${invoice.client.person.nom} ${invoice.client.person.prenom}`, 200, 220, { align: 'right' });
    } else if (invoice.client.entreprise != null) {
      doc.text(`Client Name : ${invoice.client.entreprise.nom}`, 200, 220, { align: 'right' });
    }

    // Add table headers
    doc.moveDown().fillColor('#5F259F').fontSize(12)
      .text('Article', 50, 270)
      .text('Quantité', 200, 270, { align: 'center' })
      .text('Prix', 300, 270, { align: 'center' })
      .text('Total', 400, 270, { align: 'center' })
      .moveTo(50, 285).lineTo(550, 285).stroke();

    // Add items
    let yPosition = 300;
    invoice.items.forEach(item => {
      doc.fillColor('black').fontSize(10)
        .text(item.article, 50, yPosition)
        .text(item.quantity, 200, yPosition, { align: 'center' })
        .text(`${invoice.currency.symbol} ${item.price.toFixed(2)}`, 300, yPosition, { align: 'center' })
        .text(`${invoice.currency.symbol} ${item.total.toFixed(2)}`, 400, yPosition, { align: 'center' });

      yPosition += 20;
    });

    // Add subtotal, tax, and total
    doc.fontSize(10).fillColor('black');

    // Subtotal
    doc.text('Sous-total :', 350, yPosition, { align: 'left' });
    doc.text(`${invoice.currency.symbol} ${invoice.subtotal.toFixed(2)}`, 450, yPosition, { align: 'right' });

    // Tax
    yPosition += 15; // Adjust yPosition to move down for the next line
    doc.text(`Tax ${invoice.tax.name} (${invoice.tax.value}%) :`, 350, yPosition, { align: 'left' });
    doc.text(`${invoice.currency.symbol} ${invoice.taxAmount.toFixed(2)}`, 450, yPosition, { align: 'right' });

    // Total
    yPosition += 15; // Adjust yPosition to move down for the next line
    doc.text('Total :', 350, yPosition, { align: 'left' });
    doc.text(`${invoice.currency.symbol} ${invoice.total.toFixed(2)}`, 450, yPosition, { align: 'right' });

    // Add footer
    doc.moveDown().fontSize(10).fillColor('gray')
      .text('Invoice was created on a computer and is valid without the signature and seal', 50, yPosition + 60, { align: 'center', width: 500 });

    // Finalize the PDF and save the file
    doc.end();

    // Wait until the PDF is saved, then send the email
    await sendInvoiceByEmail(invoice, pdfPath,company.name, res);
    // After sending the email, delete the PDF file from the server
    fs.unlinkSync(pdfPath);



  } catch (error) {
    console.error('Error generating PDF and sending email:', error); // Log error
    res.status(500).json({ message: 'Error generating and sending PDF', error });
  }
};



async function sendInvoiceByEmail(invoice, pdfPath, companyName, res) {
  console.log('Starting to send invoice via email...');

  try {
    // Ensure the PDF path is valid
    if (!pdfPath || !path.basename(pdfPath)) {
      console.error('Invalid PDF path');
      return res.status(400).json({ message: 'Invalid PDF path' });
    }

    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.HOST_MAILER,
      port: process.env.PORT_MAILER,
      secure: process.env.SECURE_MAILER === 'true', // Use environment variable to control secure flag
      auth: {
        user: process.env.USER_MAILER,
        pass: process.env.PASS_MAILER,
      },
      tls: {
        rejectUnauthorized: false, // Allow unauthorized certs (optional, should be used cautiously)
      },
    });

    // Determine the email recipient
    let recipientEmail, recipientName;
    if (invoice.client && invoice.client.person) {
      recipientEmail = invoice.client.person.email;
      recipientName = invoice.client.person.nom;
    } else if (invoice.client && invoice.client.entreprise) {
      recipientEmail = invoice.client.entreprise.email;
      recipientName = invoice.client.entreprise.nom;
    }

    if (!recipientEmail) {
      console.error('No recipient email found');
      return res.status(400).json({ message: 'No recipient email found' });
    }

    console.log(`Sending email to: ${recipientEmail}`);

    // Email content
    const mailOptions = {
      from: process.env.USER_MAILER,
      to: recipientEmail,
      subject: `Invoice #${invoice.number}/${invoice.year} from ${companyName}`,
      text: `Dear ${recipientName},\n\nPlease find attached your invoice.\n\nTotal Amount: ${invoice.currency.symbol}${invoice.total.toFixed(2)}\n\nThank you for your business.\n\nBest Regards,\n${companyName}`,
      attachments: [
        {
          filename: path.basename(pdfPath),
          path: pdfPath,
        },
      ],
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.response}`);

    // Update invoice status to "Envoyé"
    invoice.status = 'Envoyé';
    await invoice.save();
    console.log('Invoice status updated to "Envoyé"');

    // Respond to the API call
    return res.status(200).json({ message: 'Invoice generated and sent via email successfully' });
  } catch (error) {
    console.error('Error sending email:', error);

    // Specific error responses for better debugging
    if (error.responseCode) {
      console.error('SMTP response error code:', error.responseCode);
    }

    return res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
}






