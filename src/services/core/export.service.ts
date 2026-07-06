import { Injectable } from '@angular/core';

export type ExportFormat = 'png' | 'jpeg' | 'svg';

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

  renderRaster(svgEl: SVGSVGElement, format: ExportFormat, scale: number) {
    const viewBox = svgEl.viewBox.baseVal;
    const width = (viewBox?.width || svgEl.clientWidth) * scale;
    const height = (viewBox?.height || svgEl.clientHeight) * scale;
    const xml = new XMLSerializer().serializeToString(svgEl);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    const img = new Image();
    // Using modern TextEncoder/TextDecoder or similar isn't strictly necessary here as btoa/unescape works for SVG
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    img.src = `data:image/svg+xml;base64,${svg64}`;

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      const url = canvas.toDataURL(`image/${format}`, 0.9);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chart.${format}`;
      a.click();
    };
  }
}
