
import { Component, ChangeDetectionStrategy, viewChild, inject, ViewEncapsulation, HostListener, signal } from '@angular/core';
import { AppStateService, HistoryItem } from './services/core/app-state.service';
import { ExportService, ExportFormat } from './services/core/export.service';
import { CodeEditorComponent } from './components/code-editor.component';
import { ChartPreviewComponent } from './components/chart-preview.component';
import { AppToolbarComponent } from './components/app-toolbar.component';
import { AiCopilotComponent } from './components/modals/ai-copilot.component';
import { ExampleModalComponent } from './components/modals/example-modal.component';
import { ExportModalComponent } from './components/modals/export-modal.component';
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
  private readonly exportService = inject(ExportService);
  previewComponent = viewChild(ChartPreviewComponent);

  editorExpanded = signal(false);
  previewExpanded = signal(false);

  @HostListener('window:keydown.escape')
  onEscape() {
    // Priority: close modal → exit focus mode → discard AI proposal
    if (this.store.isAnyModalOpen()) {
      this.store.closeAllModals();
      return;
    }
    if (this.editorExpanded() || this.previewExpanded()) {
      this.editorExpanded.set(false);
      this.previewExpanded.set(false);
      return;
    }
    if (this.store.proposedCode()) {
      this.store.discardProposal();
    }
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
    this.store.closeAllModals();
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

  async handleExport(event: {format: ExportFormat, scale: number}) {
    this.store.closeAllModals();
    const svgEl = this.previewComponent()?.getSvgElement();
    if (!svgEl) {
      this.store.showStatus('Nothing to export — fix syntax errors first');
      return;
    }

    try {
      await this.exportService.renderRaster(svgEl, event.format, event.scale);
      this.store.showStatus(`Downloaded chart.${event.format}`);
    } catch (err) {
      console.error('Export failed', err);
      this.store.showStatus('Export failed');
    }
  }
}
