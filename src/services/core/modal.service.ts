import { Injectable, signal, computed } from '@angular/core';

export type ModalType = 'history' | 'ai' | 'example' | 'export' | 'settings' | null;

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private readonly activeModalSignal = signal<ModalType>(null);

  readonly activeModal = this.activeModalSignal.asReadonly();

  readonly isAnyModalOpen = computed(() => this.activeModalSignal() !== null);

  open(type: ModalType) {
    this.activeModalSignal.set(type);
  }

  close() {
    this.activeModalSignal.set(null);
  }

  isOpen(type: ModalType): boolean {
    return this.activeModalSignal() === type;
  }

  // Computed signals for individual modals to make migration easier
  readonly isHistoryOpen = computed(() => this.activeModalSignal() === 'history');
  readonly isAiOpen = computed(() => this.activeModalSignal() === 'ai');
  readonly isExampleOpen = computed(() => this.activeModalSignal() === 'example');
  readonly isExportOpen = computed(() => this.activeModalSignal() === 'export');
  readonly isSettingsOpen = computed(() => this.activeModalSignal() === 'settings');
}
