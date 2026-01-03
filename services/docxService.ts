import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ImageRun, AlignmentType, BorderStyle } from "docx";
import saveAs from "file-saver";
import { FunctionType, FunctionParams, Point } from "../types";

export const generateDocx = async (
  funcType: FunctionType,
  params: FunctionParams,
  points: Point[],
  graphImageBlob: string
) => {
  // 1. Function Title
  let title = "";
  if (funcType === FunctionType.LinearOrigin) title = `Hàm số: y = ${params.a}x`;
  else if (funcType === FunctionType.LinearAffine) title = `Hàm số: y = ${params.a}x + ${params.b >= 0 ? params.b : `(${params.b})`}`;
  else if (funcType === FunctionType.Quadratic) title = `Hàm số: y = ${params.a}x²`;

  // 1b. Short Label for Table (e.g. y = 2x)
  let tableYLabel = "y";
  if (funcType === FunctionType.LinearOrigin) tableYLabel = `y = ${params.a}x`;
  else if (funcType === FunctionType.LinearAffine) {
      const bSign = params.b >= 0 ? '+' : '-';
      tableYLabel = `y = ${params.a}x ${bSign} ${Math.abs(params.b)}`;
  }
  else if (funcType === FunctionType.Quadratic) tableYLabel = `y = ${params.a}x²`;

  // 2. Create Table Data
  // Header Row
  const xRowCells = [
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: "x", bold: true })], alignment: AlignmentType.CENTER })],
      width: { size: 1500, type: WidthType.DXA }, // Increased width for label
    }),
    ...points.map(p => new TableCell({
      children: [new Paragraph({ children: [new TextRun(p.x.toString())], alignment: AlignmentType.CENTER })],
      width: { size: 1000, type: WidthType.DXA },
    }))
  ];

  const yRowCells = [
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: tableYLabel, bold: true })], alignment: AlignmentType.CENTER })],
      width: { size: 1500, type: WidthType.DXA },
    }),
    ...points.map(p => new TableCell({
      children: [new Paragraph({ children: [new TextRun(parseFloat(p.y.toFixed(2)).toString())], alignment: AlignmentType.CENTER })],
      width: { size: 1000, type: WidthType.DXA },
    }))
  ];

  const valueTable = new Table({
    rows: [
      new TableRow({ children: xRowCells }),
      new TableRow({ children: yRowCells }),
    ],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });

  // 3. Process Image
  // graphImageBlob is a data URL (base64)
  const imageResponse = await fetch(graphImageBlob);
  const imageBuffer = await imageResponse.arrayBuffer();

  // 4. Document Construction
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "BÀI TẬP VẼ ĐỒ THỊ HÀM SỐ",
                bold: true,
                size: 32, // 16pt
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 28,
                color: "B22222"
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // Label for Table
          new Paragraph({
            children: [new TextRun({ text: "1. Bảng giá trị:", bold: true })],
            spacing: { after: 100 },
          }),

          valueTable,

          new Paragraph({ text: "", spacing: { after: 300 } }), // Spacer

          // Label for Graph
          new Paragraph({
            children: [new TextRun({ text: "2. Đồ thị hàm số:", bold: true })],
            spacing: { after: 100 },
          }),

          // Graph Image
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 500, // Pixels
                  height: 500,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),

          new Paragraph({ text: "", spacing: { after: 300 } }), // Spacer

          // Footer info
          new Paragraph({
            children: [
              new TextRun({
                text: "Được tạo tự động bởi ứng dụng GraphToán THCS.",
                italics: true,
                size: 20,
                color: "666666"
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  // 5. Save
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "DoThiHamSo.docx");
};