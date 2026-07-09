import { Injectable } from '@angular/core';

export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'webp';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  downloadFile(name: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Rasterize an SVG element to PNG/JPEG/WebP and trigger a download.
   * Returns a Promise that resolves when the download is initiated.
   */
  renderRaster(svgEl: SVGSVGElement, format: ExportFormat, scale: number): Promise<void> {
    if (format === 'svg') {
      const xml = new XMLSerializer().serializeToString(svgEl);
      this.downloadFile('chart.svg', xml, 'image/svg+xml;charset=utf-8');
      return Promise.resolve();
    }

    return this.svgToCanvas(svgEl, scale).then(canvas => {
      const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      const quality = format === 'png' ? undefined : 0.92;
      const url = canvas.toDataURL(mime, quality);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chart.${format}`;
      a.click();
    });
  }

  /** Copy raster image to clipboard when the ClipboardItem API is available. */
  async copyRasterToClipboard(svgEl: SVGSVGElement, scale = 2): Promise<void> {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
      throw new Error('Clipboard image copy is not supported in this browser.');
    }

    const canvas = await this.svgToCanvas(svgEl, scale);
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!blob) throw new Error('Failed to encode PNG for clipboard.');

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
  }

  private svgToCanvas(svgEl: SVGSVGElement, scale: number): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const viewBox = svgEl.viewBox.baseVal;
      const width = Math.max(1, Math.round((viewBox?.width || svgEl.clientWidth || 300) * scale));
      const height = Math.max(1, Math.round((viewBox?.height || svgEl.clientHeight || 300) * scale));
      const xml = new XMLSerializer().serializeToString(svgEl);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      // Opaque white background for formats that don't support transparency well
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const img = new Image();
      const svg64 = this.encodeSvgBase64(xml);
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas);
      };
      img.onerror = () => reject(new Error('Failed to load SVG for rasterization'));
      img.src = `data:image/svg+xml;base64,${svg64}`;
    });
  }

  /** UTF-8 safe base64 encoding without deprecated unescape(). */
  private encodeSvgBase64(xml: string): string {
    const bytes = new TextEncoder().encode(xml);
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }
}
