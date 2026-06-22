export const AnswerSheetLayout = {
  // Dimensions in mm
  page: { width: 210, height: 297 }, // A4
  markers: [
    { id: 'TL', top: 20, left: 20, size: 10 }, // Top-Left
    { id: 'TR', top: 20, right: 20, size: 10 }, // Top-Right
    { id: 'BL', bottom: 20, left: 20, size: 10 }, // Bottom-Left
  ],
  qrCode: { top: 35, right: 20, size: 30 },
  questionsGrid: {
    startX: 30, // margin left
    startY: 80, // margin top
    columnWidth: 80,
    rowHeight: 12,
    bubbleSpacing: 10, // distance between A, B, C, D
    bubbleSize: 5,
  },
};
