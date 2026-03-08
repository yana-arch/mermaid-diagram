
import { Component, ChangeDetectionStrategy, viewChild, inject, ViewEncapsulation } from '@angular/core';
import { AppStateService, HistoryItem } from './services/app-state.service';
import { CodeEditorComponent } from './components/code-editor.component';
import { ChartPreviewComponent } from './components/chart-preview.component';
import { AppToolbarComponent } from './components/app-toolbar.component';
import { AiModalComponent } from './components/modals/ai-modal.component';
import { ExampleModalComponent } from './components/modals/example-modal.component';
import { ExportModalComponent, ExportFormat } from './components/modals/export-modal.component';
import { SettingsModalComponent } from './components/modals/settings-modal.component';
import { HistoryModalComponent } from './components/modals/history-modal.component';
import { CHART_EXAMPLES } from './data/chart-examples';
import { ExportService } from './services/export.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': '"block min-h-screen theme-" + store.theme()'
  },
  imports: [
    CodeEditorComponent, 
    ChartPreviewComponent, 
    AppToolbarComponent,
    AiModalComponent,
    ExampleModalComponent,
    ExportModalComponent,
    SettingsModalComponent,
    HistoryModalComponent
  ],
})
export class AppComponent {
  store = inject(AppStateService);
  exportService = inject(ExportService);
  previewComponent = viewChild(ChartPreviewComponent);

  // Import from data file
  readonly chartExamples = CHART_EXAMPLES;

  // Simple getter to help template logic, though mostly handled by CSS classes
  get isLargeScreen(): boolean {
    if (typeof window !== 'undefined') {
        return window.innerWidth >= 1024;
    }
    return true;
  }

  handleAiCode(code: string) {
    this.store.setCode(code);
    this.store.isAiModalOpen.set(false);
    // Switch to preview tab on mobile to see result
    this.store.setMobileTab('preview');
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

    this.exportService.exportChart(svgEl, event.format, event.scale);
  }
}
