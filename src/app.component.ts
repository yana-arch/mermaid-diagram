
import { Component, ChangeDetectionStrategy, signal, effect, viewChild, ElementRef, inject, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MermaidService } from './services/mermaid.service';
import { GeminiService, AiInputData } from './services/gemini.service';

declare const Prism: any;

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
    name: 'State Diagram',
    code: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`
  },
  {
    name: 'ER Diagram',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`
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
    name: 'Mindmap',
    code: `mindmap
  root((Mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness
      and features
    Tools
      Pen and paper
      Mermaid`
  },
  {
    name: 'Timeline',
    code: `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : Youtube
    2006 : Twitter`
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
  },
  {
    name: 'Git Graph',
    code: `gitGraph
   commit id: "abc1"
   commit id: "def2"
   branch develop
   checkout develop
   commit id: "ghi3"
   commit id: "jkl4"
   checkout main
   merge develop
   commit id: "mno5"`
  },
  {
    name: 'Quadrant Chart',
    code: `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]`
  },
  {
    name: 'Sankey',
    code: `sankey-beta
    Agricultural 'waste',Bio-conversion,124.729
    Bio-conversion,Liquid,0.597
    Bio-conversion,Losses,26.862
    Bio-conversion,Solid,280.322
    Bio-conversion,Gas,81.144
    Biofuel imports,Liquid,35
    Biomass imports,Solid,35`
  },
  {
    name: 'XY Chart',
    code: `xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 10000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 10000, 10200, 9200, 8500, 7000, 6000]`
  },
  {
    name: 'Requirement',
    code: `requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req`
  }
];

export type ExportFormat = 'svg' | 'png' | 'jpeg' | 'webp';
export type AiTab = 'text' | 'url' | 'file';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MermaidService],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  private readonly mermaidService = inject(MermaidService);
  private readonly geminiService = inject(GeminiService);
  private readonly platformId = inject(PLATFORM_ID);

  // chartOutput is now the container div that has the innerHTML
  chartOutput = viewChild.required<ElementRef<HTMLDivElement>>('chartOutput');
  codeEditor = viewChild.required<ElementRef<HTMLElement>>('codeEditor');
  codeContainer = viewChild.required<ElementRef<HTMLPreElement>>('codeContainer');
  
  // AI Input Elements
  aiPromptInput = viewChild<ElementRef<HTMLTextAreaElement>>('aiPromptInput');
  aiUrlInput = viewChild<ElementRef<HTMLInputElement>>('aiUrlInput');
  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly themes = ['neutral', 'dark', 'forest', 'default'] as const;
  selectedTheme = signal<(typeof this.themes)[number]>('neutral');

  readonly chartExamples = CHART_EXAMPLES;
  
  // Modal States
  isExampleModalOpen = signal<boolean>(false);
  isExportModalOpen = signal<boolean>(false);
  isAiModalOpen = signal<boolean>(false);

  initialCode = CHART_EXAMPLES[0].code;

  mermaidCode = signal<string>(this.initialCode);
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  
  // AI State
  isAiLoading = signal<boolean>(false);
  aiError = signal<string | null>(null);
  activeAiTab = signal<AiTab>('text');
  
  // File Upload State
  selectedFile = signal<{name: string, type: string, content: string, isBase64: boolean} | null>(null);
  
  // Pan & Zoom State
  zoomScale = signal<number>(1);
  panOffset = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  isPanning = signal<boolean>(false);
  private dragStart = { x: 0, y: 0 };
  private initialPan = { x: 0, y: 0 };

  // Export Configuration State
  selectedExportFormat = signal<ExportFormat>('png');
  exportScale = signal<1 | 2 | 4>(2);

  private debounceTimer: any;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedCode = localStorage.getItem('mermaidCode');
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
      const editorElement = this.codeEditor()?.nativeElement;

      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('mermaidCode', code);
        localStorage.setItem('mermaidTheme', theme);

        if (editorElement) {
           editorElement.textContent = code;
           if (typeof Prism !== 'undefined' && Prism.highlightElement) {
              Prism.highlightElement(editorElement);
           }
        }
      }
      
      if (outputElement && isPlatformBrowser(this.platformId)) {
        clearTimeout(this.debounceTimer);
        this.isLoading.set(true);
        this.errorMessage.set(null);

        this.debounceTimer = setTimeout(async () => {
          if (!code.trim()) {
            outputElement.innerHTML = '<p class="text-slate-400 text-center p-8 select-none">Your chart will appear here.</p>';
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

  onEditorScroll(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const preElement = this.codeContainer()?.nativeElement;
    if (preElement) {
      preElement.scrollTop = textarea.scrollTop;
      preElement.scrollLeft = textarea.scrollLeft;
    }
  }
  
  onThemeChange(event: Event): void {
    const newTheme = (event.target as HTMLSelectElement).value as (typeof this.themes)[number];
    this.selectedTheme.set(newTheme);
  }

  // --- Pan & Zoom Logic ---

  zoomIn(): void {
    this.zoomScale.update(s => Math.min(s * 1.2, 5));
  }

  zoomOut(): void {
    this.zoomScale.update(s => Math.max(s / 1.2, 0.2));
  }

  resetZoom(): void {
    this.zoomScale.set(1);
    this.panOffset.set({ x: 0, y: 0 });
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    this.isPanning.set(true);
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.initialPan = { ...this.panOffset() };
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isPanning()) return;
    event.preventDefault();
    const dx = event.clientX - this.dragStart.x;
    const dy = event.clientY - this.dragStart.y;
    this.panOffset.set({ x: this.initialPan.x + dx, y: this.initialPan.y + dy });
  }

  onMouseUp(): void {
    this.isPanning.set(false);
  }

  onMouseLeave(): void {
    this.isPanning.set(false);
  }

  // --- Export Logic ---

  openExportModal(): void {
    if (!this.mermaidCode().trim() || !!this.errorMessage()) return;
    this.isExportModalOpen.set(true);
  }

  closeExportModal(): void {
    this.isExportModalOpen.set(false);
  }

  setExportFormat(format: ExportFormat): void {
    this.selectedExportFormat.set(format);
  }

  setExportScale(scale: 1 | 2 | 4): void {
    this.exportScale.set(scale);
  }

  confirmExport(): void {
    const format = this.selectedExportFormat();
    const svgElement = this.chartOutput()?.nativeElement.querySelector('svg');
    if (!svgElement || this.errorMessage()) return;

    this.closeExportModal();

    if (format === 'svg') {
      const svgContent = new XMLSerializer().serializeToString(svgElement);
      this.downloadFile('chart.svg', svgContent, 'image/svg+xml');
      return;
    }

    const scale = this.exportScale();
    const viewBox = svgElement.viewBox.baseVal;
    const width = (viewBox?.width || svgElement.clientWidth) * scale;
    const height = (viewBox?.height || svgElement.clientHeight) * scale;

    const svgContent = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
    }

    const img = new Image();
    const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)));

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = `image/${format}`;
      const dataUrl = canvas.toDataURL(mimeType, 0.9);
      
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `chart.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    img.src = dataUrl;
  }

  private downloadFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // --- Example Modal Logic ---
  openExampleModal(): void {
    this.isExampleModalOpen.set(true);
  }

  closeExampleModal(): void {
    this.isExampleModalOpen.set(false);
  }

  loadExample(code: string): void {
    this.mermaidCode.set(code);
    this.closeExampleModal();
    this.resetZoom();
  }

  // --- AI Logic ---
  openAiModal(): void {
    this.isAiModalOpen.set(true);
    this.aiError.set(null);
    this.activeAiTab.set('text');
    this.selectedFile.set(null);
  }

  closeAiModal(): void {
    if (!this.isAiLoading()) {
      this.isAiModalOpen.set(false);
      this.aiError.set(null);
      this.selectedFile.set(null);
    }
  }

  setActiveAiTab(tab: AiTab): void {
    this.activeAiTab.set(tab);
    this.aiError.set(null);
  }

  // --- URL Fetching ---
  async fetchUrlContent(): Promise<void> {
    const url = this.aiUrlInput()?.nativeElement.value;
    if (!url) return;

    this.isAiLoading.set(true);
    this.aiError.set(null);

    try {
      // Basic fetch - Limitation: CORS will likely block many random sites
      // In a real production app, this needs a backend proxy.
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const text = await response.text();
      // Truncate if too massive (Gemini Flash has ~1M tokens, but let's be safe for UI performance)
      const truncated = text.slice(0, 100000); 
      
      // Update the prompt input with this content
      const promptEl = this.aiPromptInput()?.nativeElement;
      if (promptEl) {
        promptEl.value = `Here is the content of ${url}:\n\n${truncated}\n\nCan you generate a diagram representing this?`;
        this.activeAiTab.set('text'); // Switch back to text view to let user edit
      }
    } catch (err) {
      this.aiError.set(`Could not fetch URL (CORS restricted?). Please copy/paste the text manually.`);
    } finally {
      this.isAiLoading.set(false);
    }
  }

  // --- File Handling ---
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    // Determine strategy based on file type
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    const isText = file.type.startsWith('text/') || 
                   file.name.endsWith('.py') || 
                   file.name.endsWith('.js') || 
                   file.name.endsWith('.ts') || 
                   file.name.endsWith('.java') || 
                   file.name.endsWith('.cpp') || 
                   file.name.endsWith('.json') || 
                   file.name.endsWith('.xml') ||
                   file.name.endsWith('.sql');

    // Binary types for Multimodal (Images, PDF)
    if (isImage || isPdf) {
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        this.selectedFile.set({
          name: file.name,
          type: file.type,
          content: base64String,
          isBase64: true
        });
      };
      reader.readAsDataURL(file);
    } 
    // Text types for prompt injection
    else if (isText) {
      reader.onload = () => {
        this.selectedFile.set({
          name: file.name,
          type: file.type || 'text/plain',
          content: reader.result as string,
          isBase64: false
        });
      };
      reader.readAsText(file);
    } 
    else {
      this.aiError.set('Unsupported file type. Please upload Code, Text, Image, or PDF.');
      input.value = ''; // Reset input
    }
  }

  removeSelectedFile(): void {
    this.selectedFile.set(null);
    if (this.fileInput()?.nativeElement) {
      this.fileInput()!.nativeElement.value = '';
    }
  }

  async generateWithAI(): Promise<void> {
    const promptInput = this.aiPromptInput()?.nativeElement;
    let prompt = promptInput?.value || '';
    const file = this.selectedFile();

    // If no prompt and no file, error
    if (!prompt.trim() && !file) {
        this.aiError.set('Please enter a description or upload a file.');
        return;
    }

    this.isAiLoading.set(true);
    this.aiError.set(null);

    try {
      const inputData: AiInputData = { prompt };

      if (file) {
        if (file.isBase64) {
          // Multimodal Input (Image/PDF)
          inputData.media = {
            mimeType: file.type,
            data: file.content
          };
          // If prompt is empty, add a default one for the image
          if (!prompt.trim()) {
            inputData.prompt = `Analyze this ${file.type} file and generate a mermaid diagram that represents its structure or flow.`;
          }
        } else {
          // Text File Input -> Append content to prompt
          inputData.prompt = `${prompt}\n\n--- File: ${file.name} ---\n${file.content}\n\nGenerate a diagram for this code/text.`;
        }
      }

      const generatedCode = await this.geminiService.generateMermaidCode(inputData);
      this.mermaidCode.set(generatedCode);
      this.closeAiModal();
      this.resetZoom();
    } catch (err) {
      this.aiError.set('Failed to generate chart. Please try again or check your API Key.');
    } finally {
      this.isAiLoading.set(false);
    }
  }

  private parseMermaidError(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.str) return error.str;
    return 'An unknown error occurred while parsing the Mermaid syntax.';
  }
}
