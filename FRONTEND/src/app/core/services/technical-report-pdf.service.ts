import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import { AppStatusService } from './app-status.service';

const COL = {
  ink: [0, 0, 0] as [number, number, number],
  muted: [80, 80, 80] as [number, number, number],
  accent: [60, 60, 60] as [number, number, number],
  accentDark: [20, 20, 20] as [number, number, number],
  band: [245, 245, 245] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  rowAlt: [250, 250, 250] as [number, number, number],
  border: [200, 200, 200] as [number, number, number],
};

/**
 * PDF con maquetación clara: portada en color, secciones, tablas con cabecera y filas alternas.
 */
@Injectable({ providedIn: 'root' })
export class TechnicalReportPdfService {
  private readonly status = inject(AppStatusService);

  downloadTechnicalReport(): void {
    const analysis = this.status.analysis();
    const corr = this.status.correlationMatrix();
    const ds = this.status.dataset();
    const st = this.status.etlStatus();

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 44;
    const contentW = pageW - margin * 2;
    let y = 0;

    const ensureSpace = (need: number) => {
      if (y + need > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    };

    /* ——— Portada ——— */
    doc.setFillColor(...COL.accentDark);
    doc.rect(0, 0, pageW, 130, 'F');
    doc.setFillColor(...COL.ink);
    doc.rect(0, 130, pageW, 3, 'F');

    doc.setTextColor(...COL.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('INFORME TÉCNICO', margin, 58);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Análisis Cuantitativo | Dataset ETL | Dashboard de Activos', margin, 78);

    doc.setFontSize(9);
    doc.setTextColor(...COL.muted);
    const gen = new Date();
    const genStr = gen.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    doc.text(`Generado: ${genStr}`, margin, 104);
    if (st?.ultimaActualizacion) {
      doc.text(`Última ejecución ETL: ${st.ultimaActualizacion}`, margin, 115);
    }

    y = 148;
    doc.setTextColor(...COL.ink);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Filas en dataset: ${ds.length}`, margin, y);
    y += 28;

    y = this.drawSectionHeading(doc, 'RESUMEN METODOLÓGICO', margin, y, contentW);
    const methLines = doc.splitTextToSize(
      [
        '• Correlaciones: Coeficiente de Pearson entre retornos diarios simples, calculado donde ambos activos tienen datos.',
        '• Volatilidad Anualizada: Desviación estándar de retornos diarios × √252.',
        '• Patrones: Análisis de ventana móvil (3 días) para identificar tendencias y cambios de volatilidad.',
        '• SMA: Media aritmética simple de los últimos N cierres.',
      ].join('\n'),
      contentW,
    );
    for (const line of methLines) {
      ensureSpace(14);
      doc.setTextColor(...COL.muted);
      doc.setFontSize(9);
      doc.text(line, margin, y);
      y += 12;
    }
    y += 16;

    /* ——— Ranking ——— */
    ensureSpace(48);
    y = this.drawSectionHeading(doc, 'RANKING DE ACTIVOS', margin, y, contentW);

    if (!analysis?.ranking?.length) {
      doc.setTextColor(...COL.muted);
      doc.setFontSize(10);
      doc.text('Sin datos. Ejecute el ETL para procesar activos.', margin, y);
      y += 28;
    } else {
      const headers = ['ACTIVO', 'σ DIARIA', 'VOL. AÑO', 'RIESGO', 'PATRÓN'];
      const colW = [60, 70, 70, 70, 100];
      const rowH = 14;
      const headH = 16;

      ensureSpace(headH + 8);
      doc.setFillColor(...COL.accentDark);
      doc.roundedRect(margin, y - 10, contentW, headH, 2, 2, 'F');
      doc.setDrawColor(...COL.border);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y - 10, contentW, headH, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COL.white);
      let x = margin + 6;
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], x, y);
        x += colW[i];
      }
      y += headH - 2;

      doc.setFont('helvetica', 'normal');
      let rowIdx = 0;
      for (const row of analysis.ranking) {
        ensureSpace(rowH + 4);
        if (rowIdx % 2 === 0) {
          doc.setFillColor(...COL.band);
          doc.rect(margin, y - 9, contentW, rowH, 'F');
        }
        doc.setTextColor(...COL.ink);
        doc.setFontSize(9);
        x = margin + 6;
        const sig = row.desviacionDiaria ?? 0;
        const cells = [
          row.activo,
          sig.toFixed(5),
          row.volatilidad.toFixed(4),
          row.riesgo,
          `${row.patrones.subida3}↑ / ${row.patrones.bajada3}↓`,
        ];
        for (let i = 0; i < cells.length; i++) {
          doc.text(cells[i], x, y);
          x += colW[i];
        }
        y += rowH;
        rowIdx++;
      }
      doc.setDrawColor(...COL.border);
      doc.setLineWidth(0.4);
      doc.line(margin, y - 4, margin + contentW, y - 4);
      y += 18;
    }

    /* ——— Dashboard de activos ——— */
    ensureSpace(48);
    y = this.drawSectionHeading(doc, 'DASHBOARD DE ACTIVOS', margin, y, contentW);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COL.muted);
    const dashboardIntro = doc.splitTextToSize(
      'Gráficos en blanco y negro que muestran la relación de los activos con riesgo y volatilidad, facilitando la toma de decisiones.',
      contentW,
    );
    for (const ln of dashboardIntro) {
      ensureSpace(12);
      doc.text(ln, margin, y);
      y += 11;
    }
    y += 14;

    if (!analysis?.ranking?.length) {
      ensureSpace(14);
      doc.text('No hay datos de análisis. Abra la vista Visualizaciones y sincronice datos.', margin, y);
      y += 20;
    } else {
      const topItems = analysis.ranking.slice(0, 10);
      const labels = topItems.map((row) => row.activo);
      const volatilityValues = topItems.map((row) => row.volatilidad);
      const sigmaValues = topItems.map((row) => row.desviacionDiaria ?? 0);

      ensureSpace(180);
      y = this.drawBarChart(doc, 'Volatilidad anualizada', labels, volatilityValues, margin, y, contentW, 120);
      y += 28;
      ensureSpace(180);
      y = this.drawLineChart(doc, 'Desviación diaria', labels, sigmaValues, margin, y, contentW, 120);
      y += 12;
    }

    /* ——— Pie ——— */
    ensureSpace(52);
    y = Math.max(y + 8, pageH - margin - 48);
    if (y > pageH - margin - 40) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(...COL.band);
    doc.roundedRect(margin, y, contentW, 40, 3, 3, 'F');
    doc.setDrawColor(...COL.border);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentW, 40, 3, 3, 'S');
    doc.setFontSize(8);
    doc.setTextColor(...COL.muted);
    const foot = doc.splitTextToSize(
      'Documento generado desde aplicación web de análisis financiero. Los datos reflejan el estado tras la última ejecución exitosa del ETL.',
      contentW - 16,
    );
    let fy = y + 12;
    for (const fl of foot) {
      doc.text(fl, margin + 8, fy);
      fy += 10;
    }

    doc.save(`informe-tecnico-etl-${Date.now()}.pdf`);
  }

  private drawBarChart(
    doc: jsPDF,
    title: string,
    labels: string[],
    values: number[],
    x: number,
    yTop: number,
    width: number,
    height: number,
  ): number {
    const chartX = x;
    const chartY = yTop + 20;
    const chartW = width;
    const chartH = height - 24;
    const maxValue = Math.max(...values, 1);
    const labelsCount = labels.length;
    const barWidth = Math.max(Math.floor((chartW - 40) / (labelsCount * 1.5)), 10);
    const gap = Math.max(Math.floor((chartW - 40 - labelsCount * barWidth) / Math.max(labelsCount - 1, 1)), 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COL.ink);
    doc.text(title, chartX, yTop + 10);

    const axisX = chartX + 30;
    const axisY = chartY + chartH - 10;
    const axisW = chartW - 40;
    const axisH = chartH - 24;

    doc.setDrawColor(...COL.ink);
    doc.setLineWidth(0.5);
    doc.line(axisX, axisY, axisX + axisW, axisY);
    doc.line(axisX, axisY, axisX, axisY - axisH);

    values.forEach((value, idx) => {
      const barHeight = Math.round((value / maxValue) * axisH);
      const bx = axisX + idx * (barWidth + gap);
      const by = axisY - barHeight;
      doc.setFillColor(...COL.accentDark);
      doc.rect(bx, by, barWidth, barHeight, 'F');
      doc.setTextColor(...COL.ink);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      const labelX = bx + barWidth / 2;
      doc.text(labels[idx].slice(0, 6), labelX, axisY + 10, { align: 'center' });
      doc.text(value.toFixed(3), labelX, by - 4, { align: 'center' });
    });

    return yTop + height;
  }

  private drawLineChart(
    doc: jsPDF,
    title: string,
    labels: string[],
    values: number[],
    x: number,
    yTop: number,
    width: number,
    height: number,
  ): number {
    const chartX = x;
    const chartY = yTop + 20;
    const chartW = width;
    const chartH = height - 24;
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;
    const pointGap = chartW / Math.max(labels.length - 1, 1);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COL.ink);
    doc.text(title, chartX, yTop + 10);

    const axisX = chartX + 30;
    const axisY = chartY + chartH - 10;
    const axisW = chartW - 40;
    const axisH = chartH - 24;

    doc.setDrawColor(...COL.ink);
    doc.setLineWidth(0.5);
    doc.line(axisX, axisY, axisX + axisW, axisY);
    doc.line(axisX, axisY, axisX, axisY - axisH);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    let prevX: number | null = null;
    let prevY: number | null = null;
    const pointGap = axisW / Math.max(labels.length - 1, 1);
    values.forEach((value, idx) => {
      const px = axisX + idx * pointGap;
      const py = axisY - ((value - minValue) / range) * axisH;
      doc.setFillColor(...COL.accentDark);
      doc.circle(px, py, 1.8, 'F');
      if (prevX !== null && prevY !== null) {
        doc.setDrawColor(...COL.ink);
        doc.setLineWidth(0.7);
        doc.line(prevX, prevY, px, py);
      }
      doc.setTextColor(...COL.muted);
      doc.text(labels[idx].slice(0, 6), px, axisY + 10, { align: 'center' });
      prevX = px;
      prevY = py;
    });

    return yTop + height;
  }

  /**
   * Mejora visual: barra gris oscura a la izquierda del titulo con linea divisoria clara.
   * @returns Posicion Y del siguiente contenido (pt).
   */
  private drawSectionHeading(doc: jsPDF, title: string, x: number, yTop: number, w: number): number {
    const titleSize = 12;
    const titleLeading = 16;
    const gapTitleToLine = 8;
    const gapLineToBody = 12;
    const barW = 4;

    doc.setFillColor(...COL.accent);
    doc.rect(x, yTop, barW, titleLeading + gapTitleToLine - 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(titleSize);
    doc.setTextColor(...COL.ink);
    const textX = x + barW + 8;
    doc.text(title, textX, yTop + titleLeading - 2);

    const lineY = yTop + titleLeading + gapTitleToLine;
    doc.setDrawColor(...COL.accent);
    doc.setLineWidth(0.7);
    doc.line(textX, lineY, x + w, lineY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COL.ink);
    return lineY + gapLineToBody;
  }
}
