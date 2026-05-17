import { Component, ChangeDetectionStrategy, input, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  originalIndex?: number;
  proposedIndex?: number;
}

@Component({
  selector: 'app-diff-viewer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="diff-viewer-wrapper flex-grow overflow-auto custom-scrollbar relative w-full h-full bg-slate-950/20">
      <div class="diff-table w-full min-w-max font-mono text-[0.875rem] leading-[1.5rem] py-4">
        @for (line of diffLines(); track $index) {
          <div class="diff-row flex items-stretch w-full select-none" [ngClass]="rowClass(line)">
            <!-- Line Number Gutters -->
            <div class="diff-gutter-old w-9 text-right pr-2 text-slate-500/70 border-r border-slate-700/20 shrink-0 select-none bg-slate-900/10">
              {{ line.type !== 'added' ? line.originalIndex : '' }}
            </div>
            <div class="diff-gutter-new w-9 text-right pr-2 text-slate-500/70 border-r border-slate-700/20 shrink-0 select-none bg-slate-900/10">
              {{ line.type !== 'removed' ? line.proposedIndex : '' }}
            </div>
            
            <!-- Prefix +/- -->
            <div class="diff-prefix w-6 text-center select-none shrink-0 font-bold" [ngClass]="prefixClass(line)">
              {{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}
            </div>
            
            <!-- Code Content -->
            <div class="diff-content flex-1 pl-2 pr-4 select-text whitespace-pre">{{ line.content }}</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .diff-viewer-wrapper {
      font-family: "Fira Code", monospace !important;
    }
    .diff-row {
      transition: background-color 0.15s ease;
    }
    
    /* Default Dark-friendly styles */
    .diff-row-added {
      background-color: var(--diff-added-bg, rgba(16, 185, 129, 0.12));
      color: var(--diff-added-text, #34d399);
    }
    .diff-row-removed {
      background-color: var(--diff-removed-bg, rgba(239, 68, 68, 0.12));
      color: var(--diff-removed-text, #f87171);
    }
    .diff-row-unchanged {
      color: var(--text-main, #e2e8f0);
    }
    .diff-row-unchanged:hover {
      background-color: rgba(255, 255, 255, 0.03);
    }

    .diff-prefix-added { color: var(--diff-added-text, #10b981); }
    .diff-prefix-removed { color: var(--diff-removed-text, #ef4444); }
    .diff-prefix-unchanged { color: var(--text-muted, #94a3b8); }
  `]
})
export class DiffViewerComponent {
  oldCode = input.required<string>();
  newCode = input.required<string>();

  diffLines = computed(() => {
    return this.computeLcsDiff(this.oldCode(), this.newCode());
  });

  rowClass(line: DiffLine): string {
    if (line.type === 'added') return 'diff-row-added';
    if (line.type === 'removed') return 'diff-row-removed';
    return 'diff-row-unchanged';
  }

  prefixClass(line: DiffLine): string {
    if (line.type === 'added') return 'diff-prefix-added';
    if (line.type === 'removed') return 'diff-prefix-removed';
    return 'diff-prefix-unchanged';
  }

  private computeLcsDiff(oldText: string, newText: string): DiffLine[] {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const m = oldLines.length;
    const n = newLines.length;

    // Build the dynamic programming table
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldLines[i - 1] === newLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Trace back the LCS to construct the diff list
    const diff: DiffLine[] = [];
    let i = m;
    let j = n;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        diff.unshift({
          type: 'unchanged',
          content: oldLines[i - 1],
          originalIndex: i,
          proposedIndex: j
        });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({
          type: 'added',
          content: newLines[j - 1],
          proposedIndex: j
        });
        j--;
      } else {
        diff.unshift({
          type: 'removed',
          content: oldLines[i - 1],
          originalIndex: i
        });
        i--;
      }
    }

    return diff;
  }
}
