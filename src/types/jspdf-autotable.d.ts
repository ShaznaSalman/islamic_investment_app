declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    head?: string[][];
    body?: string[][];
    startY?: number;
    styles?: { fontSize?: number };
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
