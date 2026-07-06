/**
 * Default Mermaid diagram code displayed on initial application load.
 * Used as the starting template for users to modify and experiment with.
 */
export const INITIAL_CODE = `graph TD
    A[Start] --> B{Is it responsive?};
    B -- Yes --> C[Looks great on mobile!];
    B -- No --> D[Add Tailwind classes];
    C --> E[Finish Project];
    D -- Refactor --> B;
    E --> F(Celebrate 🎉);`;
