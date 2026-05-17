
import { Component, ChangeDetectionStrategy, viewChild, inject, ViewEncapsulation, HostListener, signal } from '@angular/core';
import { AppStateService, HistoryItem } from './services/core/app-state.service';
import { CodeEditorComponent } from './components/code-editor.component';
import { ChartPreviewComponent } from './components/chart-preview.component';
import { AppToolbarComponent } from './components/app-toolbar.component';
import { AiCopilotComponent } from './components/modals/ai-copilot.component';
import { ExampleModalComponent } from './components/modals/example-modal.component';
import { ExportModalComponent, ExportFormat } from './components/modals/export-modal.component';
import { SettingsModalComponent } from './components/modals/settings-modal.component';
import { HistoryModalComponent } from './components/modals/history-modal.component';
import { CHART_EXAMPLES } from './data/chart-examples';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'class': 'block min-h-screen',
    '[class.theme-default]': 'store.theme() === "default"',
    '[class.theme-dark]': 'store.theme() === "dark"',
    '[class.theme-forest]': 'store.theme() === "forest"',
    '[class.theme-cyberpunk]': 'store.theme() === "cyberpunk"',
    '[class.theme-ocean]': 'store.theme() === "ocean"',
    '[class.theme-sunset]': 'store.theme() === "sunset"',
    '[class.theme-minimal]': 'store.theme() === "minimal"',
    '[class.theme-neutral]': 'store.theme() === "neutral"',
  },
  imports: [
    CodeEditorComponent, 
    ChartPreviewComponent, 
    AppToolbarComponent,
    AiCopilotComponent,
    ExampleModalComponent,
    ExportModalComponent,
    SettingsModalComponent,
    HistoryModalComponent
  ],
})
export class AppComponent {
  store = inject(AppStateService);
  previewComponent = viewChild(ChartPreviewComponent);

  editorExpanded = signal(false);
  previewExpanded = signal(false);

  @HostListener('window:keydown.escape')
  onEscape() {
    this.store.closeAllModals();
    this.editorExpanded.set(false);
    this.previewExpanded.set(false);
  }

  toggleEditorExpand() {
    this.editorExpanded.update(v => !v);
    this.previewExpanded.set(false);
  }

  togglePreviewExpand() {
    this.previewExpanded.update(v => !v);
    this.editorExpanded.set(false);
  }

  // Import from data file
  readonly chartExamples = CHART_EXAMPLES;

  // Simple getter to help template logic, though mostly handled by CSS classes
  get isLargeScreen(): boolean {
    if (typeof window !== 'undefined') {
        return window.innerWidth >= 1024;
    }
    return true;
  }

  handleExampleLoad(code: string) {
    this.store.setCode(code);
    this.store.isExampleModalOpen.set(false);
    this.previewComponent()?.resetZoom();
    // Switch to preview tab on mobile to see result
    this.store.setMobileTab('preview');
  }

  handleHistoryLoad(item: HistoryItem) {
    this.store.loadFromHistory(item);
    this.previewComponent()?.resetZoom();
    // Switch to preview tab on mobile to see result
    this.store.setMobileTab('preview');
  }

  handleExport(event: {format: ExportFormat, scale: number}) {
    this.store.isExportModalOpen.set(false);
    const svgEl = this.previewComponent()?.getSvgElement();
    if (!svgEl) return;

    if (event.format === 'svg') {
      const xml = new XMLSerializer().serializeToString(svgEl);
      this.downloadFile('chart.svg', xml, 'image/svg+xml');
      return;
    }

    this.renderRaster(svgEl, event.format, event.scale);
  }

  private renderRaster(svgEl: SVGSVGElement, format: string, scale: number) {
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

  private downloadFile(name: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
