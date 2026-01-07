
export interface ChartExample {
  name: string;
  code: string;
  category: string;
}

export const CHART_EXAMPLES: ChartExample[] = [
  // --- Core & Logic ---
  {
    name: 'Flowchart',
    category: 'Core Diagrams',
    code: `graph TD
    A[Start] --> B{Is it responsive?};
    B -- Yes --> C[Looks great on mobile!];
    B -- No --> D[Add Tailwind classes];
    C --> E[Finish Project];
    D -- Refactor --> B;
    E --> F(Celebrate 🎉);`
  },
  {
    name: 'Flowchart (Subgraphs)',
    category: 'Core Diagrams',
    code: `graph TB
    c1-->a2
    subgraph one
    a1-->a2
    end
    subgraph two
    b1-->b2
    end
    subgraph three
    c1-->c2
    end`
  },
  {
    name: 'Flowchart (Styling)',
    category: 'Core Diagrams',
    code: `graph LR
    id1(Start)-->id2(Stop)
    style id1 fill:#f9f,stroke:#333,stroke-width:4px
    style id2 fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5`
  },
  {
    name: 'Mindmap',
    category: 'Core Diagrams',
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

  // --- UML & Architecture ---
  {
    name: 'C4 Context',
    category: 'UML & Architecture',
    code: `C4Context
    title System Context diagram for Internet Banking System
    Enterprise_Boundary(b0, "BankBoundary0") {
      Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
      System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

      System_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

      System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")

      Rel(customerA, SystemAA, "Uses")
      Rel(SystemAA, SystemE, "Uses")
      Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
      Rel(SystemC, customerA, "Sends e-mails to")
    }`
  },
  {
    name: 'C4 Container',
    category: 'UML & Architecture',
    code: `C4Container
    title Container diagram for Internet Banking System
    Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
    System_Boundary(c1, "Internet Banking") {
        Container(web_app, "Web Application", "Java, Spring MVC", "Delivers the static content and the Internet banking SPA")
        Container(spa, "Single-Page App", "JavaScript, Angular", "Provides all the Internet banking functionality to customers via their web browser")
        Container(mobile_app, "Mobile App", "C#, Xamarin", "Provides a limited subset of the Internet banking functionality to customers via their mobile device")
        ContainerDb(database, "Database", "SQL Database", "Stores user registration information, hashed auth credentials, access logs, etc.")
        Container(api, "API Application", "Java, Docker Container", "Provides Internet banking functionality via API")
    }
    Rel(customerA, web_app, "Uses", "HTTPS")
    Rel(customerA, spa, "Uses", "HTTPS")
    Rel(customerA, mobile_app, "Uses")
    Rel(web_app, spa, "Delivers")
    Rel(spa, api, "Uses", "async, JSON/HTTPS")
    Rel(mobile_app, api, "Uses", "async, JSON/HTTPS")
    Rel(api, database, "Reads from and writes to", "JDBC")`
  },
  {
    name: 'Sequence Diagram',
    category: 'UML & Architecture',
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
    name: 'Sequence (Logic)',
    category: 'UML & Architecture',
    code: `sequenceDiagram
    actor User
    participant App
    participant DB
    User->>App: Login
    App->>DB: Query User
    alt User found
        DB-->>App: User Data
        App-->>User: Dashboard
    else User not found
        DB-->>App: Null
        App-->>User: Login Failed
    end`
  },
  {
    name: 'Class Diagram',
    category: 'UML & Architecture',
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
    name: 'State Diagram',
    category: 'UML & Architecture',
    code: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`
  },
  {
    name: 'State (Concurrency)',
    category: 'UML & Architecture',
    code: `stateDiagram-v2
    [*] --> Active
    state Active {
        [*] --> NumLockOff
        NumLockOff --> NumLockOn : EvNumLockPressed
        NumLockOn --> NumLockOff : EvNumLockPressed
        --
        [*] --> CapsLockOff
        CapsLockOff --> CapsLockOn : EvCapsLockPressed
        CapsLockOn --> CapsLockOff : EvCapsLockPressed
        --
        [*] --> ScrollLockOff
        ScrollLockOff --> ScrollLockOn : EvScrollLockPressed
        ScrollLockOn --> ScrollLockOff : EvScrollLockPressed
    }`
  },
  {
    name: 'ER Diagram',
    category: 'UML & Architecture',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`
  },
  {
    name: 'Requirement',
    category: 'UML & Architecture',
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
  },

  // --- Project Management ---
  {
    name: 'Gantt Chart',
    category: 'Project Management',
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
    name: 'Gantt (Milestones)',
    category: 'Project Management',
    code: `gantt
    dateFormat HH:mm
    axisFormat %H:%mm
    title Project Kickoff
    section Preparation
    Coffee            :5m
    Tea               :5m
    section Meeting
    Introduction      :10m
    Brainstorming     :20m
    Decisions         :milestone, m1, 14:35, 0m
    Wrap up           :10m`
  },
  {
    name: 'Kanban',
    category: 'Project Management',
    code: `kanban
  todo
    [Research]
    [Design]
  doing
    [Development]
    [Testing]
  done
    [Deployment]
    [Maintenance]`
  },
  {
    name: 'Timeline',
    category: 'Project Management',
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
    category: 'Project Management',
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
    category: 'Project Management',
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
    name: 'Git Graph (Flow)',
    category: 'Project Management',
    code: `gitGraph:
    commit id: "Zero"
    branch develop
    checkout develop
    commit id: "A"
    checkout main
    merge develop
    commit id: "B"
    branch feature
    checkout feature
    commit id: "C"
    checkout develop
    merge feature
    checkout main
    merge develop
    commit id: "Release" tag: "v1.0.0"`
  },

  // --- Data Visualization ---
  {
    name: 'Pie Chart',
    category: 'Data Visualization',
    code: `pie
    title Key Technologies
    "Angular" : 45
    "Mermaid.js" : 25
    "Tailwind CSS" : 15
    "TypeScript" : 15`
  },
  {
    name: 'Quadrant Chart',
    category: 'Data Visualization',
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
    category: 'Data Visualization',
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
    category: 'Data Visualization',
    code: `xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 10000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 10000, 10200, 9200, 8500, 7000, 6000]`
  },
  {
    name: 'XY Chart (Line)',
    category: 'Data Visualization',
    code: `xychart-beta
    title "Monthly Temperature"
    x-axis [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
    y-axis "Temperature (C)" 0 --> 40
    line [5, 8, 12, 18, 22, 28, 32, 31, 26, 20, 14, 8]`
  },

  // --- Systems & Networking ---
  {
    name: 'Packet Structure',
    category: 'Systems & Networking',
    code: `packet-beta
0-15: "Source Port"
16-31: "Destination Port"
32-63: "Sequence Number"
64-95: "Acknowledgment Number"
96-99: "Data Offset"
100-105: "Reserved"
106: "URG"
107: "ACK"
108: "PSH"
109: "RST"
110: "SYN"
111: "FIN"
112-127: "Window"`
  },
  {
    name: 'Block Diagram',
    category: 'Systems & Networking',
    code: `block-beta
  columns 3
  doc>"Document"]:3
  space
  down<[" "]>(down)
  space
  block:Group1:3
    l["Left"]
    m("Middle")
    r["Right"]
  end
  l-- "1" -->m
  m-- "2" -->r
  style m fill:#f9f,stroke:#333,stroke-width:4px`
  }
];
