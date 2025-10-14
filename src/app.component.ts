import { Component, ChangeDetectionStrategy, signal, effect, viewChild, ElementRef, inject, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MermaidService } from './services/mermaid.service';

const CHART_EXAMPLES = [
  {
    name: 'Flowchart',
    code: `graph TD
    A[Start] --> B{Is it responsive?};
    B -- Yes --> C[Looks great on mobile!];
    B -- No --> D[Add Tailwind classes];
    C --> E[Finish Project];
    D -- Refactor --> B;
    E --> F(Celebrate 🎉);`
  },
  {
    name: 'Sequence Diagram',
    code: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail...
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`
  },
  {
    name: 'Gantt Chart',
    code: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2024-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2024-01-12  , 12d
    another task      : 24d`
  },
  {
    name: 'Pie Chart',
    code: `pie
    title Key Technologies
    "Angular" : 45
    "Mermaid.js" : 25
    "Tailwind CSS" : 15
    "TypeScript" : 15`
  },
  {
    name: 'Class Diagram',
    code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
    class Fish{
      -int sizeInFeet
      -canEat()
    }
    class Zebra{
      +bool is_wild
      +run()
    }`
  },
    {
    name: 'User Journey',
    code: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go to work: 3: Me
      Write code: 1: Me, Cat
    section Go home
      Go home: 5: Me
      Sit down: 5: Me`
  }
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [MermaidService],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  private readonly mermaidService = inject(MermaidService);
  private readonly platformId = inject(PLATFORM_ID);

  chartOutput = viewChild.required<ElementRef<HTMLDivElement>>('chartOutput');

  readonly themes = ['neutral', 'dark', 'forest', 'default'] as const;
  selectedTheme = signal<(typeof this.themes)[number]>('neutral');

  readonly chartExamples = CHART_EXAMPLES;
  isExampleModalOpen = signal<boolean>(false);

  initialCode = CHART_EXAMPLES[0].code;

  mermaidCode = signal<string>(this.initialCode);
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  private debounceTimer: any;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedCode = localStorage.getItem('mermaidCode');
      // Load saved code, or the initial example if there's no saved code
      this.mermaidCode.set(savedCode || this.initialCode);

      const savedTheme = localStorage.getItem('mermaidTheme') as (typeof this.themes)[number];
      if (savedTheme && this.themes.includes(savedTheme)) {
        this.selectedTheme.set(savedTheme);
      }
    }
    
    effect(() => {
      const code = this.mermaidCode();
      const theme = this.selectedTheme();
      const outputElement = this.chartOutput()?.nativeElement;

      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('mermaidCode', code);
        localStorage.setItem('mermaidTheme', theme);
      }
      
      if (outputElement && isPlatformBrowser(this.platformId)) {
        clearTimeout(this.debounceTimer);
        this.isLoading.set(true);
        this.errorMessage.set(null);

        this.debounceTimer = setTimeout(async () => {
          if (!code.trim()) {
            outputElement.innerHTML = '<p class="text-slate-400 text-center p-8">Your chart will appear here.</p>';
            this.isLoading.set(false);
            return;
          }
          try {
            const svg = await this.mermaidService.render(code, theme);
            outputElement.innerHTML = svg;
            this.errorMessage.set(null);
          } catch (e: any) {
            const friendlyMessage = this.parseMermaidError(e);
            this.errorMessage.set(friendlyMessage);
            outputElement.innerHTML = '';
          } finally {
            this.isLoading.set(false);
          }
        }, 400);
      }
    }, { allowSignalWrites: true });
  }

  onCodeChange(event: Event): void {
    const newCode = (event.target as HTMLTextAreaElement).value;
    this.mermaidCode.set(newCode);
  }
  
  onThemeChange(event: Event): void {
    const newTheme = (event.target as HTMLSelectElement).value as (typeof this.themes)[number];
    this.selectedTheme.set(newTheme);
  }

  downloadSVG(): void {
    const svgContent = this.chartOutput()?.nativeElement.innerHTML;
    if (!svgContent || this.errorMessage()) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadPNG(): void {
    const svgElement = this.chartOutput()?.nativeElement.querySelector('svg');
    if (!svgElement || this.errorMessage()) return;

    const scaleFactor = 2; // for higher resolution
    const viewBox = svgElement.viewBox.baseVal;
    const width = viewBox.width * scaleFactor;
    const height = viewBox.height * scaleFactor;

    const svgContent = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)));

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = 'chart.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.onerror = (err) => {
        console.error('Failed to load SVG image for PNG conversion.', err);
    };

    img.src = dataUrl;
  }
  
  openExampleModal(): void {
    this.isExampleModalOpen.set(true);
  }

  closeExampleModal(): void {
    this.isExampleModalOpen.set(false);
  }

  loadExample(code: string): void {
    this.mermaidCode.set(code);
    this.closeExampleModal();
  }

  private parseMermaidError(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.str) return error.str;
    return 'An unknown error occurred while parsing the Mermaid syntax.';
  }
}