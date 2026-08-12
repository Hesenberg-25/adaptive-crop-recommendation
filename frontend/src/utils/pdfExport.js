import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateFertilizerPDF = (reportData) => {
  const doc = new jsPDF();
  
  // Colors (matching farm app palette)
  const primaryColor = [47, 75, 38]; // #2F4B26 (farm-primary)
  const lightBgColor = [250, 243, 224]; // #FAF3E0 (farm-accent)

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AgriVision Fertilizer Report', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

  // Farmer / Field Summary
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Field Details', 14, 55);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const details = [
    `Crop: ${reportData.crop}`,
    `Growth Stage: ${reportData.growthStage}`,
    `Land Area: ${reportData.landArea} ${reportData.unit}(s)`,
    `Soil Type: ${reportData.soilType || 'Not specified'}`
  ];
  
  details.forEach((detail, index) => {
    doc.text(detail, 14, 65 + (index * 7));
  });

  // Table
  if (reportData.fertilizers && reportData.fertilizers.length > 0) {
    const tableColumn = ["Fertilizer Name", "Recommended Dosage", "Application Method", "Timing"];
    const tableRows = reportData.fertilizers.map(f => [
      f.name, 
      f.dosage, 
      f.method, 
      f.timing
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 100,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: lightBgColor },
      styles: { fontSize: 10, cellPadding: 4 }
    });
  } else {
    doc.text('No fertilizer recommendation available for this stage.', 14, 100);
  }

  // Notes
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 120;
  if (reportData.notes && reportData.notes.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Important Notes:', 14, finalY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    reportData.notes.forEach((note, index) => {
      const splitNote = doc.splitTextToSize(`• ${note}`, 180);
      doc.text(splitNote, 14, finalY + 8 + (index * 8));
    });
  }

  // Footer / Disclaimer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Disclaimer: This is a general recommendation. Consult your local Krishi Vigyan Kendra for soil-specific advice.',
    105, 
    pageHeight - 10, 
    { align: 'center' }
  );

  // Save the PDF
  const filename = `Fertilizer_Report_${reportData.crop}_${reportData.growthStage}.pdf`;
  doc.save(filename);
};

export const generateCropReportPDF = (crop, detail) => {
  const doc = new jsPDF();
  
  // Colors (matching farm app palette)
  const primaryColor = [47, 75, 38]; // #2F4B26 (farm-primary)
  const lightBgColor = [250, 243, 224]; // #FAF3E0 (farm-accent)

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`AgriVision Crop Report: ${crop.name}`, 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'italic');
  doc.text(`${detail.scientificName} | Category: ${crop.category}`, 105, 30, { align: 'center' });

  // Basic Information
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Basic Information', 14, 55);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const basicInfo = [
    `Sowing Season: ${detail.sowingSeason || 'N/A'}`,
    `Climate: ${detail.climate?.tempRange || 'N/A'}`,
    `Soil Type: ${detail.soilType || 'N/A'}`,
    `pH Range: ${detail.ph || 'N/A'}`,
    `Duration: ${detail.duration || 'N/A'} Days`
  ];
  
  basicInfo.forEach((info, index) => {
    doc.text(info, 14, 65 + (index * 7));
  });

  // Fertilizer Requirements Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Fertilizer Requirement (per acre)', 14, 110);
  
  const fert = detail.fertilizer || {};
  const fertilizerRows = [
    ["FYM", fert.fym || 'N/A'],
    ["Nitrogen (N)", fert.nitrogen || 'N/A'],
    ["Phosphorus (P2O5)", fert.phosphorus || 'N/A'],
    ["Potassium (K2O)", fert.potassium || 'N/A']
  ];

  autoTable(doc, {
    head: [["Nutrient / Manure", "Recommended Dose"]],
    body: fertilizerRows,
    startY: 115,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: lightBgColor },
    styles: { fontSize: 10, cellPadding: 4 }
  });

  // About Section
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 170;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`About ${crop.name}`, 14, finalY);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const aboutText = detail.about || 'No additional information available.';
  const splitAbout = doc.splitTextToSize(aboutText, 180);
  doc.text(splitAbout, 14, finalY + 10);

  // Footer / Disclaimer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Disclaimer: This report is generated by AgriVision for informational purposes only.',
    105, 
    pageHeight - 10, 
    { align: 'center' }
  );

  // Save the PDF
  const filename = `${crop.name.replace(/\s+/g, '_')}_Crop_Report.pdf`;
  doc.save(filename);
};

