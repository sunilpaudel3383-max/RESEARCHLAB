import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import { ResearchDocument } from './types';
import { formatReferenceText } from './citation-utils';

export async function generateDocxBlob(doc: ResearchDocument): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, before: 200 },
      children: [
        new TextRun({
          text: doc.title,
          bold: true,
          size: 36, // 18pt
          font: 'Times New Roman',
        }),
      ],
    })
  );

  // Authors & Affiliations
  if (doc.authors && doc.authors.length > 0) {
    const authorNames = doc.authors.map(a => a.name).join(', ');
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: authorNames,
            bold: true,
            size: 24, // 12pt
            font: 'Times New Roman',
          }),
        ],
      })
    );

    const affiliations = Array.from(new Set(doc.authors.map(a => a.affiliation))).join(' | ');
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: affiliations,
            italics: true,
            size: 20, // 10pt
            font: 'Times New Roman',
            color: '555555',
          }),
        ],
      })
    );
  }

  // Abstract Block
  if (doc.abstract) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 100, after: 150 },
        children: [
          new TextRun({
            text: 'Abstract— ',
            bold: true,
            italics: true,
            size: 20,
            font: 'Times New Roman',
          }),
          new TextRun({
            text: doc.abstract,
            italics: true,
            size: 20,
            font: 'Times New Roman',
          }),
        ],
      })
    );
  }

  // Keywords
  if (doc.keywords && doc.keywords.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: 'Keywords— ',
            bold: true,
            italics: true,
            size: 19,
            font: 'Times New Roman',
          }),
          new TextRun({
            text: doc.keywords.join(', '),
            size: 19,
            font: 'Times New Roman',
          }),
        ],
      })
    );
  }

  // Sections
  for (const section of doc.sections) {
    if (section.type === 'references') {
      continue; // Handled at bottom
    }

    // Section Heading
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 280, after: 120 },
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            size: 24, // 12pt
            font: 'Times New Roman',
          }),
        ],
      })
    );

    // Section Body Paragraphs
    const paragraphs = section.content.split(/\n\n+/);
    for (const para of paragraphs) {
      if (!para.trim()) continue;
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 140, line: 360 }, // 1.5 line spacing
          indent: { firstLine: 360 }, // 0.25 in indent
          children: [
            new TextRun({
              text: para.replace(/\\\[|\\\]|\$\$|\$/g, ''),
              size: 22, // 11pt
              font: 'Times New Roman',
            }),
          ],
        })
      );
    }

    // Equations
    if (section.equations && section.equations.length > 0) {
      for (const eq of section.equations) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 140, after: 140 },
            children: [
              new TextRun({
                text: eq.latex,
                italics: true,
                font: 'Courier New',
                size: 20,
              }),
              new TextRun({
                text: `        (${eq.number})`,
                bold: true,
                font: 'Times New Roman',
                size: 20,
              }),
            ],
          })
        );
      }
    }

    // Figures
    if (section.figures && section.figures.length > 0) {
      for (const fig of section.figures) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 150, after: 80 },
            children: [
              new TextRun({
                text: `[ FIGURE ${fig.number}: ${fig.imageUrl} ]`,
                italics: true,
                size: 18,
                color: '666666',
              }),
            ],
          })
        );
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `Figure ${fig.number}. `,
                bold: true,
                size: 19,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: fig.caption,
                size: 19,
                font: 'Times New Roman',
              }),
            ],
          })
        );
      }
    }

    // Tables
    if (section.tables && section.tables.length > 0) {
      for (const tbl of section.tables) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: `TABLE ${tbl.number}: `,
                bold: true,
                size: 19,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: tbl.caption.toUpperCase(),
                size: 19,
                font: 'Times New Roman',
              }),
            ],
          })
        );

        // Render Table
        const rows: TableRow[] = [];
        // Header
        rows.push(
          new TableRow({
            children: tbl.headers.map(
              h =>
                new TableCell({
                  width: { size: 100 / tbl.headers.length, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: h, bold: true, size: 18, font: 'Times New Roman' })],
                    }),
                  ],
                })
            ),
          })
        );
        // Data Rows
        for (const rowData of tbl.rows) {
          rows.push(
            new TableRow({
              children: rowData.map(
                cell =>
                  new TableCell({
                    width: { size: 100 / rowData.length, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: cell, size: 18, font: 'Times New Roman' })],
                      }),
                    ],
                  })
              ),
            })
          );
        }

        children.push(
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
      }
    }
  }

  // References Section
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 140 },
      children: [
        new TextRun({
          text: 'References',
          bold: true,
          size: 24,
          font: 'Times New Roman',
        }),
      ],
    })
  );

  doc.references.forEach((ref, idx) => {
    const formatted = formatReferenceText(ref, doc.citationStyle, idx + 1);
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        indent: { left: 400, hanging: 400 },
        children: [
          new TextRun({
            text: formatted,
            size: 20, // 10pt
            font: 'Times New Roman',
          }),
        ],
      })
    );
  });

  const wordDocument = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(wordDocument);
}
