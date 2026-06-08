const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageBreak, LevelFormat, UnderlineType
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 32, color: "1F3864" })],
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F3864", space: 1 } }
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, color: "2E75B6" })],
    spacing: { before: 240, after: 120 }
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: "333333" })],
    spacing: { before: 180, after: 80 }
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, ...opts })],
    spacing: { before: 80, after: 80 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT
  });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 22 });
}

function para(runs) {
  return new Paragraph({ children: runs, spacing: { before: 80, after: 80 } });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text, size: 22 })],
    spacing: { before: 60, after: 60 }
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    children: [new TextRun({ text, size: 22 })],
    spacing: { before: 60, after: 60 }
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function qHeader(num, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: `Q${num}. `, bold: true, size: 24, color: "C55A11" }),
      new TextRun({ text, bold: true, size: 24, color: "1F3864" })
    ],
    spacing: { before: 280, after: 100 },
    shading: { fill: "FFF2CC", type: ShadingType.CLEAR }
  });
}

function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        children: headers.map((h, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: "2E75B6", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })] })]
        }))
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? "F2F7FD" : "FFFFFF", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })]
        }))
      }))
    ]
  });
}

function codeBlock(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Courier New", size: 18, color: "333333" })],
    shading: { fill: "F4F4F4", type: ShadingType.CLEAR },
    spacing: { before: 80, after: 80 },
    indent: { left: 360 }
  });
}

function diagramBox(title, content) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [9000],
    rows: [
      new TableRow({
        children: [new TableCell({
          borders,
          width: { size: 9000, type: WidthType.DXA },
          shading: { fill: "E7F3FF", type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
          children: [
            new Paragraph({ children: [new TextRun({ text: `[DIAGRAM: ${title}]`, bold: true, color: "2E75B6", size: 22 })], spacing: { after: 80 } }),
            ...content.map(line => new Paragraph({ children: [new TextRun({ text: line, font: "Courier New", size: 18 })], spacing: { before: 40, after: 40 } }))
          ]
        })]
      })
    ]
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
        ]
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
        ]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: "1F3864" }, paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "2E75B6" }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 }
      }
    },
    children: [
      // TITLE PAGE
      new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { before: 1440, after: 0 } }),
      new Paragraph({
        children: [new TextRun({ text: "SOFTWARE ENGINEERING", bold: true, size: 52, color: "1F3864" })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Comprehensive Study Guide", bold: true, size: 36, color: "2E75B6" })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Complete Answers to All 40 Exam Questions", size: 26, color: "555555" })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 600 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Covers: SDLC Models | Requirements Engineering | UML Diagrams | Design Concepts", size: 22, color: "666666", italics: true })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Software Metrics | Project Management | Risk Management | Quality Assurance", size: 22, color: "666666", italics: true })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 1440 }
      }),
      pageBreak(),

      // ===================== UNIT 1: SDLC MODELS & REQUIREMENTS =====================
      h1("UNIT 1: SDLC Models & Requirements Engineering"),

      // Q1
      qHeader(1, "Describe Spiral Model with suitable example."),
      h3("Definition:"),
      p("The Spiral Model is a risk-driven software development process model that combines iterative development with systematic risk management. It was proposed by Barry Boehm in 1986."),
      h3("Four Phases in Each Spiral:"),
      bullet("Planning: Determine objectives, alternatives, and constraints"),
      bullet("Risk Analysis: Identify and evaluate risks; develop risk mitigation strategies"),
      bullet("Engineering: Develop and verify the product for the current spiral"),
      bullet("Evaluation: Review by customers; plan the next iteration"),
      h3("Diagram - Spiral Model:"),
      diagramBox("Spiral Model", [
        "         PLANNING                RISK ANALYSIS",
        "          +-------+              +-------+",
        "          |       |______________|       |",
        "          |       |              |       |",
        "          +-------+              +-------+",
        "               \\                /",
        "                \\    SPIRAL    /",
        "                 \\   GROWTH  /",
        "                  \\        /",
        "          +-------+\\      /+-------+",
        "          |       | \\    / |       |",
        "          |       |  \\  /  |       |",
        "          +-------+   \\/   +-------+",
        "       CUSTOMER EVAL     ENGINEERING"
      ]),
      h3("Example: Developing a Hospital Management System"),
      makeTable(
        ["Spiral #", "Planning", "Risk Analysis", "Engineering", "Evaluation"],
        [
          ["1", "Define patient records module", "Data security risk", "Build prototype", "Client reviews"],
          ["2", "Add billing system", "Payment gateway risk", "Develop billing", "Acceptance test"],
          ["3", "Add appointment scheduling", "Concurrency risk", "Complete system", "Final review"],
        ],
        [1200, 2100, 2100, 2100, 1500]
      ),
      p(""),
      h3("Advantages:"),
      bullet("Risk is explicitly identified and addressed"),
      bullet("Suitable for large, complex, high-risk projects"),
      bullet("Allows for customer feedback at each iteration"),
      h3("Disadvantages:"),
      bullet("Complex and expensive"),
      bullet("Requires risk assessment expertise"),
      bullet("Not suitable for small projects"),

      // Q2
      pageBreak(),
      qHeader(2, "What are the elements of requirement model? Explain in brief."),
      p("A requirement model represents the system from the user's perspective and captures what the system must do (functional) and how well it must do it (non-functional)."),
      h3("Elements of the Requirement Model:"),
      h3("1. Scenario-Based Elements (Use Cases / User Stories)"),
      p("Describe sequences of events that occur when an actor uses the system. They capture the interaction between external agents and the system."),
      bullet("Use Case Diagram: Shows actors and their interactions with system functions"),
      bullet("User Stories: Informal descriptions from user's perspective (Agile)"),
      h3("2. Class-Based Elements"),
      p("Represent the object-oriented structure of the system."),
      bullet("Class Diagrams: Show classes, attributes, methods, and relationships"),
      bullet("Analysis Classes: Boundary, Control, and Entity classes"),
      h3("3. Behavioral Elements"),
      p("Represent how the system responds to external events or internal triggers."),
      bullet("State Diagrams: Show states and transitions"),
      bullet("Sequence Diagrams: Show message passing between objects"),
      bullet("Activity Diagrams: Show workflow and decision logic"),
      h3("4. Flow-Oriented Elements (Data Flow Models)"),
      p("Represent how data moves through the system."),
      bullet("Data Flow Diagrams (DFD): Show inputs, processes, outputs, and data stores"),
      bullet("Control Flow Diagrams: Show flow of control between processes"),
      h3("5. Non-functional Requirements"),
      bullet("Performance, reliability, security, maintainability, portability constraints"),
      h3("Summary Table:"),
      makeTable(
        ["Element Type", "Tools/Diagrams", "Purpose"],
        [
          ["Scenario-Based", "Use Cases, User Stories", "What users do with the system"],
          ["Class-Based", "Class Diagrams", "Object structure"],
          ["Behavioral", "State, Sequence, Activity", "Dynamic behavior"],
          ["Flow-Oriented", "DFD, CFD", "Data and control flow"],
          ["Non-functional", "SRS constraints", "Quality attributes"],
        ],
        [2400, 2400, 4200]
      ),

      // Q3
      pageBreak(),
      qHeader(3, "Apply Waterfall Model for Online Shopping System."),
      p("The Waterfall Model is a linear sequential software development lifecycle model where each phase must be completed before the next begins."),
      h3("Waterfall Model Applied to Online Shopping System:"),
      h3("Phase 1: Requirements Analysis"),
      bullet("Gather requirements from stakeholders (buyers, sellers, admin)"),
      bullet("Functional: User registration, product search, cart, payment, order tracking"),
      bullet("Non-functional: 99.9% uptime, response time < 2 seconds, secure payment"),
      bullet("Output: Software Requirements Specification (SRS) document"),
      h3("Phase 2: System Design"),
      bullet("High-Level Design: Architecture (3-tier: Presentation, Logic, Database)"),
      bullet("Low-Level Design: Database schema (Users, Products, Orders, Payments tables)"),
      bullet("UI wireframes for product pages, cart, checkout flow"),
      bullet("Output: Design Document Specification (DDS)"),
      h3("Phase 3: Implementation (Coding)"),
      bullet("Frontend: HTML/CSS/React for user interface"),
      bullet("Backend: Node.js/Django for business logic (search, cart, orders)"),
      bullet("Database: MySQL for persistent storage"),
      bullet("Payment Integration: Razorpay/Stripe API"),
      h3("Phase 4: Testing"),
      bullet("Unit Testing: Test each module (login, search, payment) separately"),
      bullet("Integration Testing: Test modules together (cart + payment)"),
      bullet("System Testing: End-to-end user journey testing"),
      bullet("UAT: Real users test the system before launch"),
      h3("Phase 5: Deployment"),
      bullet("Deploy on cloud (AWS/Azure)"),
      bullet("Configure CDN for fast product image delivery"),
      bullet("Set up SSL certificate for secure transactions"),
      h3("Phase 6: Maintenance"),
      bullet("Bug fixes based on user feedback"),
      bullet("Add new features (wishlist, coupons)"),
      bullet("Performance optimization"),
      diagramBox("Waterfall Model - Online Shopping", [
        "  [Requirements] --> [Design] --> [Coding] --> [Testing] --> [Deploy] --> [Maintenance]",
        "        |               |             |            |            |              |",
        "   User needs      Architecture   Frontend    Unit Tests   Live Site    Bug Fixes",
        "   SRS Document    DB Schema      Backend     Integration  SSL/CDN      New Features"
      ]),

      // Q4
      pageBreak(),
      qHeader(4, "Outline four requirement elicitation techniques."),
      p("Requirement elicitation is the process of gathering requirements from stakeholders. The four main techniques are:"),
      h3("1. Interviews"),
      para([bold("Definition: "), new TextRun({ text: "Direct, one-on-one or group discussions with stakeholders.", size: 22 })]),
      bullet("Structured Interview: Fixed set of questions prepared in advance"),
      bullet("Unstructured Interview: Open-ended, exploratory conversation"),
      bullet("Example: Interviewing bank managers and tellers to understand ATM workflow"),
      h3("2. Questionnaires / Surveys"),
      para([bold("Definition: "), new TextRun({ text: "Standardized forms with questions distributed to multiple stakeholders.", size: 22 })]),
      bullet("Useful when stakeholders are geographically distributed"),
      bullet("Closed questions (yes/no, multiple choice) for quantitative data"),
      bullet("Open questions for detailed responses"),
      bullet("Example: Survey 500 employees about what features they need in an HR portal"),
      h3("3. Observation (Ethnographic Study)"),
      para([bold("Definition: "), new TextRun({ text: "Analysts observe users performing their actual tasks in their work environment.", size: 22 })]),
      bullet("Helps discover implicit requirements that users take for granted"),
      bullet("Active observation: Analyst participates in tasks"),
      bullet("Passive observation: Analyst watches without participating"),
      bullet("Example: Observing a cashier at a retail store to understand POS system needs"),
      h3("4. Prototyping / JAD Sessions"),
      para([bold("Definition: "), new TextRun({ text: "Creating early working models or Joint Application Development workshops.", size: 22 })]),
      bullet("Prototype: Quick mock-up shown to users to gather feedback"),
      bullet("JAD: Facilitated workshop with developers, users, and analysts together"),
      bullet("Helps clarify vague requirements through hands-on exploration"),
      bullet("Example: Building a clickable wireframe of a mobile banking app for user feedback"),

      // Q5
      pageBreak(),
      qHeader(5, "A startup is developing an AI-based health monitoring system. Identify three functional and non-functional requirements."),
      h3("Functional Requirements (What the system must DO):"),
      makeTable(
        ["#", "Functional Requirement", "Description"],
        [
          ["FR1", "Real-time Health Monitoring", "The system shall continuously collect heart rate, blood pressure, and SpO2 from wearable sensors and display on dashboard."],
          ["FR2", "AI-Based Anomaly Detection", "The system shall use ML algorithms to detect abnormal health patterns and generate alerts to patients and doctors."],
          ["FR3", "Medical Report Generation", "The system shall automatically generate daily/weekly health summary reports in PDF format and share via email/app."],
        ],
        [500, 2800, 5700]
      ),
      p(""),
      h3("Non-Functional Requirements (How the system must PERFORM):"),
      makeTable(
        ["#", "Non-Functional Requirement", "Specification"],
        [
          ["NFR1", "Performance", "The system must process sensor data and generate alerts within 2 seconds of detecting an anomaly."],
          ["NFR2", "Security & Privacy", "All health data must be encrypted (AES-256) at rest and in transit; must comply with HIPAA regulations."],
          ["NFR3", "Availability", "The system shall maintain 99.99% uptime; critical alert system must function even during network outages via local processing."],
        ],
        [500, 2800, 5700]
      ),

      // Q6
      pageBreak(),
      qHeader(6, "What is SRS? What are the characteristics of SRS?"),
      para([bold("Definition: "), new TextRun({ text: "Software Requirements Specification (SRS) is a formal document that completely describes the behavior of the system to be developed. It is the contract between the development team and the client.", size: 22 })]),
      h3("Contents of an SRS Document:"),
      bullet("Introduction: Purpose, scope, definitions, overview"),
      bullet("Overall Description: Product perspective, functions, user characteristics, constraints"),
      bullet("Specific Requirements: Functional, non-functional, interface requirements"),
      bullet("Appendices: Supporting information, assumptions"),
      h3("Characteristics of a Good SRS (IEEE 830 Standard):"),
      makeTable(
        ["Characteristic", "Meaning", "Example"],
        [
          ["Correct", "Every requirement is accurately stated", "No wrong assumptions about system behavior"],
          ["Unambiguous", "Each requirement has only one interpretation", "Use precise language, avoid 'fast' - say '< 2 seconds'"],
          ["Complete", "All requirements are documented", "Covers all scenarios including error cases"],
          ["Consistent", "No conflicting requirements", "Two requirements don't contradict each other"],
          ["Ranked/Prioritized", "Requirements have priority levels", "MoSCoW: Must have, Should have, Could have, Won't have"],
          ["Verifiable", "Requirements can be tested", "Measurable criteria for each requirement"],
          ["Modifiable", "Can be changed without disrupting structure", "Well-organized with numbering and cross-references"],
          ["Traceable", "Origin of each requirement is known", "Each req. links back to stakeholder or business need"],
        ],
        [2000, 3500, 3500]
      ),

      // Q7
      pageBreak(),
      qHeader(7, "Discuss software design and explain its importance in software engineering."),
      para([bold("Definition: "), new TextRun({ text: "Software design is the process of defining the architecture, components, interfaces, and other characteristics of a system to satisfy specified requirements. It is the blueprint for building the software.", size: 22 })]),
      h3("Levels of Software Design:"),
      bullet("Architectural Design: High-level structure (client-server, microservices, layered)"),
      bullet("Data Design: Transforms data models into data structures (ER diagrams to tables)"),
      bullet("Interface Design: Defines how system components communicate (APIs, UI)"),
      bullet("Component-Level Design: Detailed design of individual modules (algorithms, logic)"),
      h3("Importance of Software Design:"),
      makeTable(
        ["Importance", "Explanation"],
        [
          ["Blueprint for Development", "Provides developers a clear plan to follow, reducing ambiguity"],
          ["Reduces Complexity", "Breaks system into manageable, understandable components"],
          ["Improves Quality", "Good design leads to maintainable, reliable, and efficient code"],
          ["Enables Reusability", "Well-designed components can be reused in other projects"],
          ["Cost Reduction", "Catching design flaws early is 10x cheaper than fixing after coding"],
          ["Facilitates Communication", "Design documents enable developers, testers, and managers to align"],
          ["Supports Testing", "Clear design enables creation of effective test cases"],
          ["Manages Risk", "Early identification of architectural risks reduces project failure"],
        ],
        [3000, 6000]
      ),

      // Q8
      pageBreak(),
      qHeader(8, "Illustrate modularity, cohesion, and coupling and explain how they affect software quality."),
      h3("1. Modularity"),
      para([bold("Definition: "), new TextRun({ text: "Modularity is the practice of dividing a software system into separate, independent units (modules) that can be developed, tested, and maintained independently.", size: 22 })]),
      bullet("Goal: Divide-and-conquer - manage complexity through independent units"),
      bullet("Each module has a clear purpose and well-defined interfaces"),
      bullet("Example: An e-commerce app divided into: Auth Module, Product Module, Cart Module, Payment Module"),
      p("Effect on Quality: Improves maintainability, testability, and allows parallel development."),
      h3("2. Cohesion"),
      para([bold("Definition: "), new TextRun({ text: "Cohesion measures how closely related the responsibilities within a single module are. High cohesion means a module does one well-defined thing.", size: 22 })]),
      p("Types of Cohesion (from Worst to Best):"),
      makeTable(
        ["Type", "Description", "Quality"],
        [
          ["Coincidental", "Unrelated functions grouped arbitrarily", "Worst"],
          ["Logical", "Functions with same general category", "Poor"],
          ["Temporal", "Functions executed at same time", "Poor"],
          ["Procedural", "Functions in specific execution order", "Moderate"],
          ["Communicational", "Functions operating on same data", "Good"],
          ["Sequential", "Output of one is input to next", "Good"],
          ["Functional", "All elements contribute to single task", "Best"],
        ],
        [2200, 4600, 2200]
      ),
      p(""),
      h3("3. Coupling"),
      para([bold("Definition: "), new TextRun({ text: "Coupling measures the degree of interdependence between software modules. Low coupling means modules are independent.", size: 22 })]),
      makeTable(
        ["Type", "Description", "Quality"],
        [
          ["Content Coupling", "One module modifies another's internals", "Worst"],
          ["Common Coupling", "Modules share global data", "Poor"],
          ["Control Coupling", "One module controls flow of another", "Moderate"],
          ["Stamp Coupling", "Modules share composite data structure", "Moderate"],
          ["Data Coupling", "Modules communicate only via parameters", "Best"],
        ],
        [2200, 4600, 2200]
      ),
      p(""),
      diagramBox("Cohesion vs Coupling Relationship", [
        "  GOAL: High Cohesion + Low Coupling = GOOD SOFTWARE QUALITY",
        "",
        "  High Cohesion: Module does ONE thing well",
        "  Low Coupling:  Modules are INDEPENDENT of each other",
        "",
        "  Bad Design:  [Module A] <--many connections--> [Module B]",
        "  Good Design: [Module A] --> [Interface] <-- [Module B]"
      ]),

      // Q9
      pageBreak(),
      qHeader(9, "Illustrate a Use Case Diagram for AI-based Hiring Process."),
      h3("Actors:"),
      bullet("Recruiter (Primary actor)"),
      bullet("Candidate (Primary actor)"),
      bullet("AI System (Secondary system actor)"),
      bullet("HR Manager (Secondary actor)"),
      h3("Use Cases:"),
      bullet("Upload Job Description"),
      bullet("Submit Resume/Application"),
      bullet("Screen Resume (AI)"),
      bullet("Shortlist Candidates (AI)"),
      bullet("Schedule Interview"),
      bullet("Conduct Interview"),
      bullet("Generate Hiring Report"),
      diagramBox("Use Case Diagram - AI Based Hiring System", [
        "                    +------------------------------------------+",
        "                    |        AI Hiring System                  |",
        "                    |                                          |",
        "  [Recruiter] ------|---> (Upload Job Description)             |",
        "                    |---> (Screen Resumes) <---- [AI System]   |",
        "                    |---> (Shortlist Candidates) <-- [AI System]|",
        "                    |---> (Schedule Interview)                 |",
        "                    |---> (Generate Hiring Report)             |",
        "                    |                                          |",
        "  [Candidate] ------|---> (Submit Application)                |",
        "                    |---> (Upload Resume)                      |",
        "                    |---> (Receive Notification)               |",
        "                    |                                          |",
        "  [HR Manager] -----|---> (Review Shortlist)                  |",
        "                    |---> (Approve/Reject Candidates)          |",
        "                    |---> (View Reports)                       |",
        "                    +------------------------------------------+",
        "",
        "  Note: Includes relationships:",
        "  (Screen Resumes) <<includes>> (Parse Resume with NLP)",
        "  (Shortlist Candidates) <<includes>> (Score & Rank Candidates)",
        "  (Upload Job Description) <<extends>> (Set Screening Criteria)"
      ]),

      // Q10
      pageBreak(),
      qHeader(10, "State and explain the various tasks of requirement engineering in detail."),
      p("Requirement Engineering (RE) is a systematic process of eliciting, analyzing, documenting, and managing requirements for a software system."),
      h3("Seven Tasks of Requirement Engineering:"),
      h3("1. Inception (Feasibility Study)"),
      bullet("Understand the basic problem and determine if a solution is feasible"),
      bullet("Identify key stakeholders and their basic needs"),
      bullet("Output: Feasibility report"),
      h3("2. Elicitation (Requirements Gathering)"),
      bullet("Actively gather detailed requirements using interviews, surveys, observation"),
      bullet("Understand what the system should do from the user's perspective"),
      bullet("Challenge: Stakeholders often don't know exactly what they want"),
      h3("3. Elaboration"),
      bullet("Create an analysis model that identifies data, function, and behavior"),
      bullet("Expand on elicited requirements to create more detailed specifications"),
      bullet("Use UML diagrams to represent requirements visually"),
      h3("4. Negotiation"),
      bullet("Resolve conflicts between stakeholder requirements"),
      bullet("Balance competing requirements (e.g., feature richness vs. development time)"),
      bullet("Prioritize requirements using techniques like MoSCoW"),
      h3("5. Specification"),
      bullet("Document requirements formally in an SRS (Software Requirements Specification)"),
      bullet("SRS serves as contract between client and development team"),
      bullet("Requirements must be: complete, consistent, unambiguous, verifiable"),
      h3("6. Validation"),
      bullet("Review requirements to ensure they accurately represent stakeholder needs"),
      bullet("Techniques: Requirements reviews, prototyping, test case generation"),
      bullet("Detect errors early (10x cheaper to fix now than after coding)"),
      h3("7. Management"),
      bullet("Track requirements throughout the project lifecycle"),
      bullet("Handle requirements changes in a controlled manner"),
      bullet("Maintain traceability matrix (requirement to design to code to test)"),
      makeTable(
        ["Task", "Key Activity", "Output"],
        [
          ["Inception", "Feasibility study", "Problem statement"],
          ["Elicitation", "Interviews, surveys, observation", "Raw requirements list"],
          ["Elaboration", "UML modeling", "Analysis model"],
          ["Negotiation", "Conflict resolution, prioritization", "Agreed requirements"],
          ["Specification", "Write SRS document", "SRS document"],
          ["Validation", "Reviews, prototyping", "Validated requirements"],
          ["Management", "Change control, traceability", "Requirements traceability matrix"],
        ],
        [2200, 3600, 3200]
      ),

      // Q11
      pageBreak(),
      qHeader(11, "Construct Class Diagram for a ride-sharing application."),
      h3("Key Classes and Their Attributes:"),
      makeTable(
        ["Class", "Attributes", "Methods"],
        [
          ["Rider", "riderId, name, phone, email, rating", "bookRide(), cancelRide(), rateDriver()"],
          ["Driver", "driverId, name, phone, licenseNo, rating, isAvailable", "acceptRide(), startRide(), endRide(), rateRider()"],
          ["Vehicle", "vehicleId, make, model, plateNo, vehicleType", "getDetails()"],
          ["Ride", "rideId, status, startTime, endTime, fare, distance", "calculateFare(), getStatus()"],
          ["Location", "latitude, longitude, address", "getCoordinates()"],
          ["Payment", "paymentId, amount, method, status, timestamp", "processPayment(), refund()"],
          ["RideHistory", "historyId, rides[], totalRides", "getHistory(), getRating()"],
        ],
        [2000, 3600, 3400]
      ),
      p(""),
      h3("Relationships:"),
      bullet("Rider BOOKS Ride (Association: 1 Rider books many Rides)"),
      bullet("Driver ACCEPTS Ride (Association: 1 Driver accepts many Rides)"),
      bullet("Driver OWNS Vehicle (Aggregation: 1 Driver has 1 Vehicle)"),
      bullet("Ride HAS Location - source and destination (Composition: 2 Locations per Ride)"),
      bullet("Ride GENERATES Payment (Association: 1 Ride has 1 Payment)"),
      bullet("Rider HAS RideHistory (Aggregation)"),
      diagramBox("Class Diagram - Ride Sharing Application", [
        " +-------------+     books     +------------------+    accepts    +-------------+",
        " |   Rider     |-------------->|      Ride        |<--------------|   Driver    |",
        " +-------------+  1       *    +------------------+   *       1   +-------------+",
        " | -riderId    |               | -rideId          |               | -driverId   |",
        " | -name       |               | -status          |               | -name       |",
        " | -phone      |               | -startTime       |               | -licenseNo  |",
        " | -rating     |               | -endTime         |               | -rating     |",
        " +-------------+               | -fare            |               | -isAvailable|",
        "        |                      | -distance        |               +-------------+",
        "        | has                  +------------------+                     | owns",
        "        v                       |      |                               v",
        " +-----------+           has    |      |generates              +------------+",
        " |RideHistory|<-----------------+      v                       |  Vehicle   |",
        " +-----------+              +-----------+                      +------------+",
        "                            |  Payment  |                      | -vehicleId |",
        "                            +-----------+                      | -make      |",
        "                            | -amount   |                      | -model     |",
        "                            | -method   |                      | -plateNo   |",
        "                            +-----------+                      +------------+"
      ]),

      // Q12
      pageBreak(),
      qHeader(12, "Draw a Use Case Diagram for a travel booking platform."),
      h3("Actors:"),
      bullet("User/Traveler (Primary actor)"),
      bullet("Admin (Primary actor)"),
      bullet("Payment Gateway (External system actor)"),
      h3("Use Cases:"),
      bullet("User: Register/Login, Search Travel Options, Book Tickets, Make Payment, Receive Confirmation, Track Booking, Cancel Booking"),
      bullet("Admin: Manage Travel Services, Manage Bookings, View Reports, Add/Remove Routes"),
      diagramBox("Use Case Diagram - Travel Booking Platform", [
        "                    +------------------------------------------------+",
        "                    |          Travel Booking Platform               |",
        "                    |                                                |",
        "  [User] -----------|---> (Register / Login)                        |",
        "                    |---> (Search Travel Options)                    |",
        "                    |---> (View Travel Details)                      |",
        "                    |---> (Book Tickets)                             |",
        "                    |         <<includes>> (Select Seat)             |",
        "                    |         <<includes>> (Enter Passenger Info)    |",
        "                    |---> (Make Payment) <------- [Payment Gateway] |",
        "                    |         <<extends>> (Apply Coupon)             |",
        "                    |---> (Receive Confirmation)                     |",
        "                    |---> (Track Booking Status)                     |",
        "                    |---> (Cancel Booking)                           |",
        "                    |                                                |",
        "  [Admin] ----------|---> (Manage Travel Services)                  |",
        "                    |---> (Add/Edit/Delete Routes)                   |",
        "                    |---> (Manage Bookings)                          |",
        "                    |---> (View Revenue Reports)                     |",
        "                    |---> (Manage User Accounts)                     |",
        "                    +------------------------------------------------+"
      ]),

      // Q13
      pageBreak(),
      qHeader(13, "Draw a State Diagram for an online examination platform."),
      h3("States and Transitions:"),
      makeTable(
        ["State", "Description", "Trigger to Next State"],
        [
          ["Idle", "System waiting for student login", "Student logs in"],
          ["Authenticated", "Student logged in successfully", "Student clicks Start Exam"],
          ["Exam Started", "Exam timer running, questions displayed", "Student answers & navigates"],
          ["Answering Questions", "Student viewing/answering questions", "All answered or timer ends"],
          ["Auto-Submitted", "Timer expired - system submits automatically", "Timer = 0"],
          ["Submitted", "Student manually submits exam", "Student clicks Submit"],
          ["Processing", "System evaluates answers", "Evaluation complete"],
          ["Result Displayed", "Score and feedback shown to student", "Student logs out"],
        ],
        [2200, 3200, 3600]
      ),
      p(""),
      diagramBox("State Diagram - Online Examination System", [
        "  [IDLE] --login--> [AUTHENTICATED] --start exam--> [EXAM STARTED]",
        "                                                          |",
        "                                                    timer running",
        "                                                          |",
        "                                                    [ANSWERING]",
        "                                                     /        \\",
        "                                          submit btn/          \\timer=0",
        "                                                /                \\",
        "                                        [SUBMITTED]      [AUTO-SUBMITTED]",
        "                                                \\                /",
        "                                                 \\              /",
        "                                                [PROCESSING RESULT]",
        "                                                        |",
        "                                                [RESULT DISPLAYED]",
        "                                                        |",
        "                                                     logout",
        "                                                        |",
        "                                                     [IDLE]",
        "",
        "  State Transitions:",
        "  • Idle -> Authenticated: [login successful]",
        "  • Authenticated -> Exam Started: [start exam clicked] / start timer",
        "  • Answering -> Submitted: [submit clicked] / save answers",
        "  • Answering -> Auto-Submitted: [timer = 0] / save all answers",
        "  • Processing -> Result Displayed: [evaluation complete] / show score"
      ]),

      // Q14
      pageBreak(),
      qHeader(14, "Draw a sequence diagram for ATM withdrawal system."),
      h3("Actors and Objects:"),
      bullet("Customer (Actor)"),
      bullet("ATM Machine (System)"),
      bullet("Bank Server (Backend)"),
      bullet("Account Database"),
      diagramBox("Sequence Diagram - ATM Withdrawal", [
        "Customer    ATM Machine      Bank Server      Account DB",
        "   |              |               |               |",
        "   |--insert card-->              |               |",
        "   |              |--read card--->|               |",
        "   |              |<--card valid--|               |",
        "   |<--prompt PIN--|              |               |",
        "   |---enter PIN-->|              |               |",
        "   |              |--validate PIN->               |",
        "   |              |              |--query account->|",
        "   |              |              |<--account data--|",
        "   |              |<--PIN valid--|               |",
        "   |<--show menu---|              |               |",
        "   |--select Withdraw-->          |               |",
        "   |<--prompt amount--|           |               |",
        "   |--enter amount--->|           |               |",
        "   |              |--check balance->              |",
        "   |              |              |--check balance->|",
        "   |              |              |<--balance OK---|",
        "   |              |<--authorized-|               |",
        "   |              |--debit amount->              |",
        "   |              |              |--update bal--->|",
        "   |              |              |<--updated------|",
        "   |<--dispense cash|             |               |",
        "   |<--print receipt|             |               |",
        "   |--remove card-->|             |               |"
      ]),

      // Q15
      pageBreak(),
      qHeader(15, "Compute the Function Point value for the given project."),
      h3("Given Data:"),
      makeTable(
        ["Component", "Count", "Weight", "Weighted Count"],
        [
          ["External Inputs (EI)", "64", "4", "256"],
          ["External Outputs (EO)", "120", "5", "600"],
          ["External Inquiries (EQ)", "48", "4", "192"],
          ["Internal Logical Files (ILF)", "16", "10", "160"],
          ["External Interface Files (EIF)", "4", "7", "28"],
        ],
        [3000, 1500, 1500, 3000]
      ),
      p(""),
      h3("Step 1: Calculate Unadjusted Function Points (UFP)"),
      para([new TextRun({ text: "UFP = (64 × 4) + (120 × 5) + (48 × 4) + (16 × 10) + (4 × 7)", size: 22 })]),
      para([new TextRun({ text: "UFP = 256 + 600 + 192 + 160 + 28", size: 22 })]),
      para([new TextRun({ text: "UFP = 1236", bold: true, size: 22 })]),
      h3("Step 2: Calculate Value Adjustment Factor (VAF)"),
      para([new TextRun({ text: "Given: 14 General System Characteristics (Fi), each Fi = 3", size: 22 })]),
      para([new TextRun({ text: "Sum of Fi = 14 × 3 = 42", size: 22 })]),
      para([new TextRun({ text: "VAF = 0.65 + (0.01 × Sum of Fi)", size: 22 })]),
      para([new TextRun({ text: "VAF = 0.65 + (0.01 × 42)", size: 22 })]),
      para([new TextRun({ text: "VAF = 0.65 + 0.42 = 1.07", bold: true, size: 22 })]),
      h3("Step 3: Calculate Adjusted Function Points (AFP)"),
      para([new TextRun({ text: "AFP = UFP × VAF", size: 22 })]),
      para([new TextRun({ text: "AFP = 1236 × 1.07", size: 22 })]),
      new Paragraph({
        children: [new TextRun({ text: "AFP = 1322.52 ≈ 1323 Function Points", bold: true, size: 26, color: "2E75B6" })],
        shading: { fill: "E7F3FF", type: ShadingType.CLEAR },
        spacing: { before: 120, after: 120 }, indent: { left: 360 }
      }),

      // Q16
      pageBreak(),
      qHeader(16, "Analyze project activities of an Online Banking System and prepare a Gantt chart."),
      h3("Project Activities Identified:"),
      makeTable(
        ["Task ID", "Task Name", "Duration (weeks)", "Dependencies", "Start Week"],
        [
          ["T1", "Requirements Gathering", "2", "None", "Week 1"],
          ["T2", "System Architecture Design", "2", "T1", "Week 3"],
          ["T3", "Database Design", "1", "T1", "Week 3"],
          ["T4", "UI/UX Design", "2", "T1", "Week 3"],
          ["T5", "Backend Development (Auth, Accounts)", "3", "T2, T3", "Week 5"],
          ["T6", "Frontend Development", "3", "T4", "Week 5"],
          ["T7", "Payment Gateway Integration", "2", "T5", "Week 8"],
          ["T8", "Security Implementation", "2", "T5", "Week 8"],
          ["T9", "Unit & Integration Testing", "2", "T6, T7, T8", "Week 10"],
          ["T10", "UAT & Bug Fixing", "1", "T9", "Week 12"],
          ["T11", "Deployment & Go Live", "1", "T10", "Week 13"],
        ],
        [1000, 2800, 1600, 1800, 1800]
      ),
      p(""),
      h3("Gantt Chart (Text Representation):"),
      diagramBox("Gantt Chart - Online Banking System", [
        "Task                    | W1| W2| W3| W4| W5| W6| W7| W8| W9|W10|W11|W12|W13|",
        "------------------------|---|---|---|---|---|---|---|---|---|---|---|---|---|",
        "T1: Requirements        |███|███|   |   |   |   |   |   |   |   |   |   |   |",
        "T2: Architecture Design |   |   |███|███|   |   |   |   |   |   |   |   |   |",
        "T3: Database Design     |   |   |███|   |   |   |   |   |   |   |   |   |   |",
        "T4: UI/UX Design        |   |   |███|███|   |   |   |   |   |   |   |   |   |",
        "T5: Backend Development |   |   |   |   |███|███|███|   |   |   |   |   |   |",
        "T6: Frontend Development|   |   |   |   |███|███|███|   |   |   |   |   |   |",
        "T7: Payment Integration |   |   |   |   |   |   |   |███|███|   |   |   |   |",
        "T8: Security            |   |   |   |   |   |   |   |███|███|   |   |   |   |",
        "T9: Testing             |   |   |   |   |   |   |   |   |   |███|███|   |   |",
        "T10: UAT & Bug Fix      |   |   |   |   |   |   |   |   |   |   |   |███|   |",
        "T11: Deployment         |   |   |   |   |   |   |   |   |   |   |   |   |███|",
        "",
        "Critical Path: T1 -> T2 -> T5 -> T7 -> T9 -> T10 -> T11 (13 weeks)"
      ]),

      // Q17
      pageBreak(),
      qHeader(17, "Analyze software development effort using Basic COCOMO model for 30 KLOC Organic project."),
      h3("Basic COCOMO Model:"),
      p("COCOMO (Constructive Cost Model) by Barry Boehm estimates effort, duration, and team size."),
      h3("Given:"),
      bullet("Size: 30 KLOC (Kilo Lines of Code)"),
      bullet("Mode: Organic (small team, familiar environment, less rigid requirements)"),
      h3("Organic Mode Coefficients:"),
      makeTable(
        ["Parameter", "Formula", "Organic Coefficients"],
        [
          ["Effort (E)", "E = a × (KLOC)^b", "a = 2.4, b = 1.05"],
          ["Development Time (T)", "T = c × (E)^d", "c = 2.5, d = 0.38"],
          ["People Required (P)", "P = E / T", "-"],
        ],
        [2500, 3000, 3500]
      ),
      p(""),
      h3("1. Effort Calculation:"),
      para([new TextRun({ text: "E = 2.4 × (30)^1.05", size: 22 })]),
      para([new TextRun({ text: "30^1.05 = 30 × 30^0.05 = 30 × 1.1746 = 35.24", size: 22 })]),
      para([new TextRun({ text: "E = 2.4 × 35.24 = 84.57 person-months", size: 22 })]),
      new Paragraph({
        children: [new TextRun({ text: "Effort ≈ 84.57 Person-Months", bold: true, size: 24, color: "1F3864" })],
        shading: { fill: "E7F3FF", type: ShadingType.CLEAR }, spacing: { before: 100, after: 100 }, indent: { left: 360 }
      }),
      h3("2. Development Time Calculation:"),
      para([new TextRun({ text: "T = 2.5 × (84.57)^0.38", size: 22 })]),
      para([new TextRun({ text: "84.57^0.38 ≈ 5.81", size: 22 })]),
      para([new TextRun({ text: "T = 2.5 × 5.81 = 14.52 months", size: 22 })]),
      new Paragraph({
        children: [new TextRun({ text: "Development Time ≈ 14.52 Months", bold: true, size: 24, color: "1F3864" })],
        shading: { fill: "E7F3FF", type: ShadingType.CLEAR }, spacing: { before: 100, after: 100 }, indent: { left: 360 }
      }),
      h3("3. Number of Persons Required:"),
      para([new TextRun({ text: "P = E / T = 84.57 / 14.52 = 5.82", size: 22 })]),
      new Paragraph({
        children: [new TextRun({ text: "Number of Persons ≈ 6 People", bold: true, size: 24, color: "1F3864" })],
        shading: { fill: "E7F3FF", type: ShadingType.CLEAR }, spacing: { before: 100, after: 100 }, indent: { left: 360 }
      }),

      // Q18
      pageBreak(),
      qHeader(18, "Explain design concepts: Abstraction, Patterns, Modularity."),
      h3("i) Abstraction"),
      para([bold("Definition: "), new TextRun({ text: "Abstraction is the process of representing essential features without including background details. It focuses on WHAT rather than HOW.", size: 22 })]),
      p("Types of Abstraction:"),
      bullet("Procedural Abstraction: A function name represents a sequence of instructions (e.g., calculateTax() hides tax computation logic)"),
      bullet("Data Abstraction: A data object represents a collection of data (e.g., Stack class hides internal array implementation)"),
      bullet("Control Abstraction: Represents control flow mechanisms at a higher level"),
      p("Example: When you call car.start(), you don't need to know about fuel injection, ignition timing, or spark plug firing - that's abstraction."),
      h3("ii) Patterns"),
      para([bold("Definition: "), new TextRun({ text: "Design patterns are proven, reusable solutions to commonly occurring software design problems. They represent best practices evolved over time.", size: 22 })]),
      p("Categories (Gang of Four Patterns):"),
      makeTable(
        ["Category", "Purpose", "Examples"],
        [
          ["Creational", "Object creation mechanisms", "Singleton, Factory, Builder"],
          ["Structural", "Class/object composition", "Adapter, Decorator, Facade"],
          ["Behavioral", "Object interaction and responsibility", "Observer, Strategy, Command"],
        ],
        [2200, 3200, 3600]
      ),
      p(""),
      p("Example: Observer Pattern - When a stock price changes, all registered investors (observers) are automatically notified."),
      h3("iii) Modularity"),
      para([bold("Definition: "), new TextRun({ text: "Modularity is the design principle of dividing a software system into separate, independent components (modules) that can be developed, tested, and maintained independently.", size: 22 })]),
      bullet("Each module has a single, well-defined purpose"),
      bullet("Modules communicate through well-defined interfaces"),
      bullet("Changes in one module minimally affect others"),
      p("Example: A banking application with separate modules: Authentication, Account Management, Transaction Processing, Notification Service, Report Generation."),
      p("Principle: Modules should exhibit high cohesion (internal) and low coupling (between modules)."),

      // Q19
      pageBreak(),
      qHeader(19, "What is meant by coupling and cohesion? Explain in relation with good software design."),
      para([bold("Cohesion - "), new TextRun({ text: "The degree to which elements within a single module belong together.", size: 22 })]),
      para([bold("Coupling - "), new TextRun({ text: "The degree of interdependence between different modules.", size: 22 })]),
      h3("Cohesion Types (Low to High):"),
      makeTable(
        ["Level", "Type", "Description", "Example"],
        [
          ["1 (Lowest)", "Coincidental", "Random grouping of unrelated functions", "Utilities.java with random functions"],
          ["2", "Logical", "Related category but different logic", "All I/O operations in one module"],
          ["3", "Temporal", "Execute at same time", "All startup initialization functions"],
          ["4", "Procedural", "Specific order of execution", "Steps in file processing"],
          ["5", "Communicational", "Operate on same data", "Functions reading same file"],
          ["6", "Sequential", "Output of one feeds next", "Pipeline processing stages"],
          ["7 (Highest)", "Functional", "All elements for one task", "calculateMonthlyInterest()"],
        ],
        [1000, 1800, 3000, 3200]
      ),
      p(""),
      h3("Coupling Types (High to Low):"),
      makeTable(
        ["Level", "Type", "Description", "Impact"],
        [
          ["1 (Worst)", "Content", "Module directly modifies another's code", "Very hard to maintain"],
          ["2", "Common", "Share global variables", "Changes affect all modules"],
          ["3", "Control", "Pass control flags", "Modules depend on each other's logic"],
          ["4", "Stamp", "Pass entire data structure", "Extra data dependency"],
          ["5 (Best)", "Data", "Pass only needed parameters", "Easy to test and maintain"],
        ],
        [1000, 1800, 3000, 3200]
      ),
      p(""),
      h3("Impact on Good Software Design:"),
      bullet("High Cohesion: Easier to understand, test, maintain, and reuse modules"),
      bullet("Low Coupling: Changes in one module don't cascade to others; easier parallel development"),
      bullet("Golden Rule: Aim for Functional Cohesion + Data Coupling for best design quality"),

      // Q20
      pageBreak(),
      qHeader(20, "What is the importance of software design? What are types of design classes?"),
      h3("Importance of Software Design:"),
      makeTable(
        ["Importance", "Description"],
        [
          ["Quality Product", "Good design translates requirements into a quality product that meets user needs"],
          ["Cost Effective", "Design flaws found early cost 10-100x less than post-release fixes"],
          ["Maintainability", "Well-designed software is easier to modify, extend, and maintain"],
          ["Communication", "Design documents serve as communication bridge between team members"],
          ["Reusability", "Good design promotes reuse of components across projects"],
          ["Risk Reduction", "Identifies architectural risks before coding begins"],
          ["Testing Support", "Clear design enables systematic test case creation"],
          ["Performance", "Design decisions directly impact system performance and scalability"],
        ],
        [3000, 6000]
      ),
      p(""),
      h3("Types of Design Classes:"),
      makeTable(
        ["Design Class Type", "Description", "Example"],
        [
          ["User Interface Classes", "Classes that define UI components and user interaction", "LoginScreen, Dashboard, ProductCard"],
          ["Business Domain Classes", "Represent business concepts from problem domain", "Customer, Order, Invoice, Account"],
          ["Process Classes", "Implement business functions and processing logic", "PaymentProcessor, OrderValidator"],
          ["Persistent Classes", "Store data that persists beyond program execution", "UserRepository, OrderDAO"],
          ["System Classes", "Handle system infrastructure and utilities", "DatabaseConnection, Logger, Config"],
        ],
        [2500, 3500, 3000]
      ),

      // Q21
      pageBreak(),
      qHeader(21, "Describe with an example how the effect of risk on project schedule is evaluated using PERT."),
      para([bold("PERT (Program Evaluation and Review Technique): "), new TextRun({ text: "A statistical tool for analyzing and representing the tasks involved in completing a given project, especially useful for risk evaluation.", size: 22 })]),
      h3("Three Time Estimates in PERT:"),
      makeTable(
        ["Estimate", "Symbol", "Description"],
        [
          ["Optimistic Time", "O (a)", "Minimum time if everything goes perfectly"],
          ["Most Likely Time", "M (m)", "Expected time under normal conditions"],
          ["Pessimistic Time", "P (b)", "Maximum time if everything goes wrong"],
        ],
        [2500, 1500, 5000]
      ),
      p(""),
      h3("PERT Formulas:"),
      para([new TextRun({ text: "Expected Time: Te = (O + 4M + P) / 6", bold: true, size: 22, font: "Courier New" })]),
      para([new TextRun({ text: "Variance: σ² = ((P - O) / 6)²", bold: true, size: 22, font: "Courier New" })]),
      para([new TextRun({ text: "Standard Deviation: σ = (P - O) / 6", bold: true, size: 22, font: "Courier New" })]),
      h3("Example: Software Testing Activity"),
      makeTable(
        ["Activity", "Optimistic (O)", "Most Likely (M)", "Pessimistic (P)", "Te = (O+4M+P)/6", "Variance σ²"],
        [
          ["Write Test Cases", "2", "4", "8", "(2+16+8)/6 = 4.33", "((8-2)/6)² = 1.0"],
          ["Execute Tests", "3", "5", "10", "(3+20+10)/6 = 5.5", "((10-3)/6)² = 1.36"],
          ["Bug Fixing", "2", "6", "15", "(2+24+15)/6 = 6.83", "((15-2)/6)² = 4.69"],
          ["Regression Testing", "1", "3", "6", "(1+12+6)/6 = 3.17", "((6-1)/6)² = 0.69"],
        ],
        [2200, 1200, 1500, 1500, 2000, 1600]
      ),
      p(""),
      para([new TextRun({ text: "Total Expected Project Duration = 4.33 + 5.5 + 6.83 + 3.17 = 19.83 days", size: 22 })]),
      para([new TextRun({ text: "Total Variance = 1.0 + 1.36 + 4.69 + 0.69 = 7.74", size: 22 })]),
      para([new TextRun({ text: "Standard Deviation = √7.74 = 2.78 days", size: 22 })]),
      para([new TextRun({ text: "Risk Interpretation: 68% probability project completes within 19.83 ± 2.78 days (17-22.6 days)", bold: true, size: 22, color: "2E75B6" })]),

      // Q22
      pageBreak(),
      qHeader(22, "Discuss any 2: LOC-Based Estimation, FP Based Estimation, Problem-Based Estimation."),
      h3("i) LOC-Based Estimation (Lines of Code)"),
      para([bold("Definition: "), new TextRun({ text: "Estimates project effort and cost based on the number of lines of source code to be developed.", size: 22 })]),
      p("Process:"),
      numbered("Decompose the system into functions/modules"),
      numbered("Estimate LOC for each module (Optimistic, Most Likely, Pessimistic)"),
      numbered("Calculate expected LOC: LOC = (O + 4M + P) / 6"),
      numbered("Use historical productivity data: Effort = LOC / Productivity"),
      p("Example:"),
      makeTable(
        ["Module", "Optimistic", "Most Likely", "Pessimistic", "Expected LOC"],
        [
          ["Login Module", "100", "200", "400", "(100+800+400)/6 = 217"],
          ["Dashboard", "300", "500", "900", "(300+2000+900)/6 = 533"],
          ["Reports", "200", "400", "700", "(200+1600+700)/6 = 417"],
        ],
        [2300, 1200, 1400, 1400, 2700]
      ),
      para([new TextRun({ text: "Total Expected LOC = 1167. If productivity = 200 LOC/person-month, Effort = 1167/200 = 5.84 person-months", size: 22 })]),
      p("Limitations: LOC varies by programming language; doesn't measure design quality."),
      h3("ii) Function Point (FP) Based Estimation"),
      para([bold("Definition: "), new TextRun({ text: "Language-independent metric that measures software size based on the amount of functionality delivered to the user.", size: 22 })]),
      p("Components: External Inputs (EI), External Outputs (EO), External Inquiries (EQ), Internal Logical Files (ILF), External Interface Files (EIF)"),
      p("Formula: AFP = UFP × VAF, where VAF = 0.65 + (0.01 × ΣFi)"),
      p("Advantage: Language-independent; focuses on user functionality; more accurate than LOC for business applications."),
      h3("iii) Problem-Based Estimation (Decomposition)"),
      para([bold("Definition: "), new TextRun({ text: "Breaks down the software problem into smaller sub-problems and estimates each independently, then aggregates.", size: 22 })]),
      p("Approach: WBS (Work Breakdown Structure) → estimate each work package → sum for total project."),
      p("Useful for: Well-understood projects with clearly defined scope."),

      // Q23
      pageBreak(),
      qHeader(23, "Discuss any 2: Risk Refinement, Risk Mitigation, Risk Management."),
      h3("i) Risk Refinement"),
      para([bold("Definition: "), new TextRun({ text: "The process of analyzing identified risks more precisely to understand their full impact and probability.", size: 22 })]),
      p("Steps:"),
      numbered("Initial risk identification (broad categories)"),
      numbered("Decompose each risk into sub-risks"),
      numbered("Assess probability and impact of each sub-risk"),
      numbered("Create Risk Information Sheet (RIS) for each risk"),
      p("Example: 'Technology Risk' is refined into:"),
      bullet("Hardware failure risk (probability: 20%, impact: high)"),
      bullet("Software compatibility risk (probability: 30%, impact: medium)"),
      bullet("Network outage risk (probability: 10%, impact: high)"),
      makeTable(
        ["Risk Factor", "Probability", "Impact", "Risk Exposure = P × I"],
        [
          ["Hardware failure", "0.20", "High (8)", "1.6"],
          ["SW compatibility", "0.30", "Medium (5)", "1.5"],
          ["Network outage", "0.10", "High (8)", "0.8"],
        ],
        [2700, 1700, 1800, 2800]
      ),
      p(""),
      h3("ii) Risk Mitigation"),
      para([bold("Definition: "), new TextRun({ text: "Risk mitigation involves taking proactive actions to reduce the probability of a risk occurring or minimize its impact if it does occur.", size: 22 })]),
      p("Strategies:"),
      bullet("Risk Avoidance: Change the project plan to eliminate the risk entirely"),
      bullet("Risk Reduction: Take steps to reduce probability or impact"),
      bullet("Risk Transfer: Transfer risk to a third party (insurance, outsourcing)"),
      bullet("Risk Acceptance: Accept and plan contingency if risk occurs"),
      makeTable(
        ["Risk", "Mitigation Strategy", "Action"],
        [
          ["Key developer leaves", "Risk Reduction", "Cross-train team members; document all processes"],
          ["Budget overrun", "Risk Acceptance", "Create 15% contingency reserve in budget"],
          ["Data security breach", "Risk Transfer", "Implement cyber insurance + hire security experts"],
          ["Technology failure", "Risk Avoidance", "Use proven, well-tested technologies instead of new ones"],
        ],
        [2500, 2000, 4500]
      ),

      // Q24
      pageBreak(),
      qHeader(24, "Define Quality Assurance (QA) and explain its process."),
      para([bold("Definition: "), new TextRun({ text: "Software Quality Assurance (SQA) is a set of activities that ensure that the processes, methods, and tools used to develop software are adequate to produce high-quality software products. It is a proactive, process-focused approach (unlike testing which is product-focused).", size: 22 })]),
      h3("QA vs QC Distinction:"),
      makeTable(
        ["Aspect", "Quality Assurance (QA)", "Quality Control (QC)"],
        [
          ["Focus", "Process", "Product/Output"],
          ["Goal", "Prevent defects", "Find and fix defects"],
          ["Activities", "Reviews, audits, standards", "Testing, inspection"],
          ["When", "Throughout SDLC", "After development"],
        ],
        [2000, 3680, 3320]
      ),
      p(""),
      h3("SQA Process Activities:"),
      h3("1. SQA Planning"),
      bullet("Prepare SQA Plan document specifying QA activities, standards, and responsibilities"),
      bullet("Define acceptance criteria and quality metrics"),
      h3("2. Process Monitoring & Control"),
      bullet("Monitor software development activities against defined processes"),
      bullet("Track metrics: defect density, code coverage, review effectiveness"),
      h3("3. Standards and Procedures"),
      bullet("IEEE standards for SRS, design, testing"),
      bullet("Coding standards (naming conventions, documentation requirements)"),
      h3("4. Reviews and Audits"),
      bullet("Formal Technical Reviews (FTR): Peer review of design and code"),
      bullet("Process Audits: Check if teams follow defined processes"),
      bullet("Product Audits: Verify deliverables meet specifications"),
      h3("5. Testing Oversight"),
      bullet("Review test plans and test cases for completeness"),
      bullet("Ensure testing covers all requirements"),
      h3("6. Change Management"),
      bullet("Control software changes through formal change control process"),
      bullet("Ensure changes don't introduce new defects"),
      h3("7. Risk Management"),
      bullet("Identify quality risks early"),
      bullet("Plan mitigations to prevent quality issues"),

      // Q25
      pageBreak(),
      qHeader(25, "Explain how project management tools help in task assignment, tracking progress, and collaboration."),
      h3("Project Management Tools Overview:"),
      p("Tools like JIRA, Trello, Microsoft Project, and Asana help manage software projects effectively."),
      h3("i) Task Assignment"),
      bullet("Create tasks/stories and assign to specific team members with clear ownership"),
      bullet("Set due dates, priorities, and estimates (story points or hours)"),
      bullet("Role-based assignment ensures right skills are applied to right tasks"),
      bullet("JIRA: Create user stories, assign to developers, set sprint targets"),
      bullet("Trello: Drag-and-drop cards with assignees, labels, and checklists"),
      h3("ii) Tracking Progress"),
      bullet("Kanban Boards: Visual pipeline (To Do → In Progress → Review → Done)"),
      bullet("Burndown Charts: Show remaining work vs. time in a sprint"),
      bullet("Velocity Charts: Team's average output per sprint"),
      bullet("Gantt Charts: Timeline view of tasks and dependencies"),
      bullet("Dashboards: Real-time metrics on sprint progress, bug counts, blocked items"),
      diagramBox("Kanban Board - Progress Tracking", [
        "| TO DO          | IN PROGRESS    | IN REVIEW      | DONE           |",
        "|----------------|----------------|----------------|----------------|",
        "| Login Module   | Payment API    | Search Feature | User Auth      |",
        "| Cart Feature   | Dashboard UI   |                | Database Setup |",
        "| Reports        |                |                | API Gateway    |"
      ]),
      h3("iii) Collaboration"),
      bullet("Comments and @mentions: Team members communicate directly on tasks"),
      bullet("File Attachments: Share designs, documents, and screenshots on tasks"),
      bullet("Notifications: Automated alerts when tasks are updated or blocked"),
      bullet("Integration: Slack notifications, GitHub commits linked to JIRA issues"),
      bullet("Shared Roadmaps: Stakeholders see overall project status at a glance"),

      // Q26
      pageBreak(),
      qHeader(26, "Explain the seven tasks of Requirements Engineering Process."),
      p("(Same as Q10 - see detailed answer above. Key summary:)"),
      makeTable(
        ["Task #", "Task Name", "Key Activity", "Output"],
        [
          ["1", "Inception", "Understand problem scope and feasibility", "Problem statement"],
          ["2", "Elicitation", "Gather requirements from stakeholders", "Raw requirements"],
          ["3", "Elaboration", "Model requirements with UML diagrams", "Analysis model"],
          ["4", "Negotiation", "Resolve conflicts, prioritize requirements", "Agreed requirements"],
          ["5", "Specification", "Document in formal SRS", "SRS document"],
          ["6", "Validation", "Review for completeness and consistency", "Validated SRS"],
          ["7", "Management", "Track changes, maintain traceability", "RTM (Traceability Matrix)"],
        ],
        [600, 1800, 3800, 2800]
      ),
      p(""),
      h3("Key Tool: Requirements Traceability Matrix (RTM)"),
      makeTable(
        ["Req. ID", "Requirement", "Design Element", "Code Module", "Test Case"],
        [
          ["FR-001", "User login", "Auth class diagram", "AuthService.java", "TC-001"],
          ["FR-002", "View balance", "Account sequence diagram", "AccountService.java", "TC-002"],
        ],
        [1200, 2400, 2000, 2000, 1400]
      ),

      // Q27
      pageBreak(),
      qHeader(27, "Explain the MoSCoW Prioritization Technique with examples."),
      para([bold("MoSCoW: "), new TextRun({ text: "A requirement prioritization technique that categorizes requirements into four categories to help teams focus on delivering maximum value.", size: 22 })]),
      makeTable(
        ["Category", "Meaning", "Characteristics", "Example (E-commerce App)"],
        [
          ["M - Must Have", "Non-negotiable requirements; system fails without them", "Critical for launch; legal/safety requirements", "User registration, Product listing, Shopping cart, Payment processing, Order confirmation"],
          ["S - Should Have", "Important but not vital; high value requirements", "Expected by users; painful if absent but workable", "Product search, User reviews, Order tracking, Email notifications, Wishlist"],
          ["C - Could Have", "Nice-to-have features; include if time permits", "Desirable but small impact if omitted", "Social media login, Product recommendations, Loyalty points, Dark mode, Multi-language"],
          ["W - Won't Have", "Explicitly out of scope for this release", "Acknowledged but deferred to future releases", "AR product preview, AI chatbot, Drone delivery tracking, Cryptocurrency payment"],
        ],
        [1400, 3000, 2400, 2200]
      ),
      p(""),
      h3("Application in Project Planning:"),
      bullet("Must Have items define the MVP (Minimum Viable Product)"),
      bullet("Helps manage scope creep by explicitly categorizing future features"),
      bullet("Stakeholders must agree on the categorization before development starts"),
      bullet("Typical split: Must (60%), Should (20%), Could (10%), Won't (10%) of effort"),

      // Q28
      pageBreak(),
      qHeader(28, "Define Use Case Modeling and explain its importance."),
      para([bold("Definition: "), new TextRun({ text: "Use Case Modeling is a technique for capturing the functional requirements of a system by describing how different users (actors) interact with the system to achieve specific goals.", size: 22 })]),
      h3("Key Components:"),
      makeTable(
        ["Component", "Symbol", "Description"],
        [
          ["Actor", "Stick figure", "External entity (user/system) that interacts with the system"],
          ["Use Case", "Oval/Ellipse", "Specific functionality or goal the actor wants to achieve"],
          ["System Boundary", "Rectangle", "Defines what is inside and outside the system"],
          ["Association", "Line", "Relationship between actor and use case"],
          ["Include", "Dashed arrow <<include>>", "Use case always includes another use case"],
          ["Extend", "Dashed arrow <<extend>>", "Use case optionally extends another use case"],
          ["Generalization", "Solid arrow", "Actor or use case inherits from a general one"],
        ],
        [2000, 2500, 4500]
      ),
      p(""),
      h3("Importance of Use Case Modeling:"),
      bullet("Captures Functional Requirements: Describes what the system does from user's perspective"),
      bullet("Stakeholder Communication: Non-technical stakeholders easily understand use cases"),
      bullet("Scope Definition: System boundary clearly shows what is in and out of scope"),
      bullet("Test Planning: Each use case becomes a basis for system test cases"),
      bullet("Development Guidance: Use cases drive design, coding, and testing activities"),
      bullet("Ambiguity Reduction: Concrete scenarios resolve misunderstandings early"),

      // Q29
      pageBreak(),
      qHeader(29, "Explain Reactive and Proactive Risk Management Strategies with examples."),
      makeTable(
        ["Aspect", "Reactive Strategy", "Proactive Strategy"],
        [
          ["Definition", "Respond to risks AFTER they occur", "Identify and address risks BEFORE they occur"],
          ["Approach", "Fire-fighting, crisis management", "Planned, systematic risk analysis"],
          ["Timing", "After risk materializes", "Before project begins and throughout"],
          ["Cost", "Higher (rework, delays)", "Lower (prevention is cheaper)"],
          ["Control", "Reactive, less control", "Proactive, more control"],
        ],
        [2000, 3680, 3320]
      ),
      p(""),
      h3("Reactive Risk Management:"),
      para([bold("Definition: "), new TextRun({ text: "The team deals with risks only when they become problems. 'Fire-and-Fix' approach.", size: 22 })]),
      p("Types:"),
      bullet("Crisis Management: Address emergencies as they arise"),
      bullet("Mitigation Mode: Fix problems with minimum damage control"),
      bullet("Workaround: Find quick fixes when a problem hits"),
      p("Example: A team is building an e-commerce site. When the database crashes on launch day (risk not anticipated), the team scrambles to restore backups. This results in 6 hours of downtime and revenue loss."),
      h3("Proactive Risk Management:"),
      para([bold("Definition: "), new TextRun({ text: "Systematic identification, analysis, and mitigation of risks before they occur. Industry best practice.", size: 22 })]),
      p("Steps:"),
      numbered("Risk Identification: Brainstorm, use checklists, review similar past projects"),
      numbered("Risk Analysis: Assess probability and impact (Risk Exposure = P × I)"),
      numbered("Risk Prioritization: Focus on highest exposure risks"),
      numbered("Risk Mitigation Planning: Define preventive and contingency actions"),
      numbered("Risk Monitoring: Track risks throughout project"),
      p("Example: Same e-commerce team proactively identifies database crash as a risk (P=0.2, I=high). They implement: database clustering, automated backups every 2 hours, failover mechanism, and load testing before launch. Result: Zero downtime."),

      // Q30
      pageBreak(),
      qHeader(30, "Explain Software Quality Assurance (SQA) and its activities."),
      para([bold("SQA Definition: "), new TextRun({ text: "A systematic, planned set of actions to provide adequate confidence that software processes and products conform to established technical requirements and management needs.", size: 22 })]),
      h3("Key SQA Activities:"),
      makeTable(
        ["SQA Activity", "Description", "Tools/Techniques"],
        [
          ["Standards Application", "Apply IEEE, ISO standards to all phases", "IEEE 830 (SRS), ISO 9001"],
          ["Technical Reviews (FTR)", "Peer review of requirements, design, code", "Checklists, walkthroughs"],
          ["Software Testing", "Verify software against requirements", "Unit, Integration, System tests"],
          ["Error Collection & Analysis", "Track and analyze defects to find patterns", "Defect tracking tools, Pareto analysis"],
          ["Change Control", "Manage changes to prevent uncontrolled changes", "Configuration management tools"],
          ["Record Keeping", "Maintain SQA records for audit trail", "SQA logs, review records"],
          ["Reporting", "Report SQA activities to management", "Weekly SQA status reports"],
        ],
        [2500, 3500, 3000]
      ),
      p(""),
      h3("SQA Metrics:"),
      bullet("Defect Density: Number of defects per KLOC"),
      bullet("Review Effectiveness: Percentage of defects found in reviews vs. testing"),
      bullet("Test Coverage: Percentage of requirements covered by test cases"),
      bullet("Customer Satisfaction: Post-release defect reports and user ratings"),

      // Q31
      pageBreak(),
      qHeader(31, "What are the characteristics of good design? Explain Design Patterns."),
      h3("Characteristics of Good Software Design:"),
      makeTable(
        ["Characteristic", "Description"],
        [
          ["Correctness", "Design must implement all requirements correctly"],
          ["Completeness", "All components and interfaces are defined"],
          ["Efficiency", "Optimal use of resources (CPU, memory, network)"],
          ["Flexibility", "Easy to adapt to changing requirements"],
          ["Maintainability", "Easy to understand, modify, and debug"],
          ["Reusability", "Components can be reused in other systems"],
          ["Simplicity", "No unnecessary complexity; KISS principle"],
          ["Modularity", "Clear module boundaries with high cohesion and low coupling"],
          ["Reliability", "System performs correctly under expected and unexpected conditions"],
          ["Testability", "Design facilitates systematic testing"],
        ],
        [3000, 6000]
      ),
      p(""),
      h3("Design Patterns:"),
      para([bold("Definition: "), new TextRun({ text: "A design pattern is a reusable solution to a commonly occurring problem within a given context in software design.", size: 22 })]),
      makeTable(
        ["Pattern", "Category", "Problem Solved", "Example"],
        [
          ["Singleton", "Creational", "Ensure only one instance exists", "Database connection pool"],
          ["Factory", "Creational", "Create objects without specifying exact class", "UI widget creation"],
          ["Adapter", "Structural", "Make incompatible interfaces compatible", "Legacy system integration"],
          ["Observer", "Behavioral", "Notify multiple objects about state changes", "Event listener, Stock ticker"],
          ["Strategy", "Behavioral", "Define family of algorithms; make them interchangeable", "Sort algorithm selection"],
          ["Decorator", "Structural", "Add behavior to object dynamically", "I/O streams in Java"],
        ],
        [1800, 1800, 2900, 2500]
      ),

      // Q32
      pageBreak(),
      qHeader(32, "Define the types of Structural Modeling in detail with examples."),
      para([bold("Structural Modeling: "), new TextRun({ text: "Represents the static structure of a system - how classes, objects, and components are organized and related. It shows WHAT the system is composed of.", size: 22 })]),
      h3("Types of Structural Models:"),
      h3("1. Class Diagram"),
      p("Shows classes, their attributes, methods, and relationships."),
      p("Relationships: Association, Aggregation, Composition, Inheritance, Dependency, Realization"),
      p("Example: Bank System class diagram with Customer, Account, Transaction, Bank classes"),
      diagramBox("Class Diagram - Example", [
        "+----------+       +-------------+       +-------------+",
        "| Customer |------>|   Account   |<------|  Transaction|",
        "+----------+  has  +-------------+  has  +-------------+",
        "| -name    |  1..* | -accNo      |  0..* | -txnId      |",
        "| -custId  |       | -balance    |       | -amount     |",
        "| -email   |       | -type       |       | -date       |",
        "+----------+       +-------------+       +-------------+"
      ]),
      h3("2. Object Diagram"),
      p("Shows specific instances of classes at a particular point in time. A snapshot of the system."),
      p("Example: Customer object 'john_doe' with Account object 'acc_001' showing actual values."),
      h3("3. Component Diagram"),
      p("Shows the physical components (executables, libraries, databases) and their dependencies."),
      p("Example: Web app with Frontend component, Backend API component, Database component, Auth Service component."),
      h3("4. Deployment Diagram"),
      p("Shows the physical deployment of software onto hardware nodes."),
      p("Example: Web server node, Application server node, Database server node connected via network."),
      h3("5. Package Diagram"),
      p("Shows how model elements are organized into groups (packages/namespaces)."),
      p("Example: com.ecommerce.auth, com.ecommerce.products, com.ecommerce.orders packages."),

      // Q33
      pageBreak(),
      qHeader(33, "Define the types of Behavioral Modeling in detail with examples."),
      para([bold("Behavioral Modeling: "), new TextRun({ text: "Represents the dynamic behavior of a system - how objects interact and change state over time. It shows HOW the system behaves.", size: 22 })]),
      h3("Types of Behavioral Models:"),
      h3("1. Use Case Diagram"),
      p("Shows system functionality from the user's perspective. Actors interact with use cases."),
      p("Example: Library system - Student (actor) → Search Books, Borrow Book, Return Book (use cases)"),
      h3("2. Sequence Diagram"),
      p("Shows message exchanges between objects over time. Emphasizes time ordering."),
      p("Example: Online purchase flow - User, Browser, Server, Database exchanging messages"),
      h3("3. Activity Diagram"),
      p("Shows workflow of activities including decision points, parallel activities, and swim lanes."),
      p("Example: ATM withdrawal - Insert Card → Enter PIN → Select Amount → Dispense Cash"),
      h3("4. State (Statechart) Diagram"),
      p("Shows states an object can be in and transitions triggered by events."),
      p("Example: Order states: Pending → Confirmed → Shipped → Delivered → Cancelled"),
      diagramBox("State Diagram - Order Processing", [
        "  [Pending] --payment confirmed--> [Confirmed] --shipped--> [Shipped]",
        "      |                                 |                       |",
        "  cancelled                         cancelled              delivered",
        "      |                                 |                       |",
        "      v                                 v                       v",
        "  [Cancelled]                      [Cancelled]            [Delivered]"
      ]),
      h3("5. Collaboration/Communication Diagram"),
      p("Shows object interactions organized around the objects. Emphasizes structural organization."),
      p("Example: Same as sequence diagram but organized spatially, showing which objects communicate."),
      h3("6. Timing Diagram"),
      p("Shows behavior of objects over time with precise timing constraints."),
      p("Example: Real-time system where sensor data must be processed within 10ms."),

      // Q34
      pageBreak(),
      qHeader(34, "Explain COCOMO model for project estimation with suitable example."),
      para([bold("COCOMO (Constructive Cost Model): "), new TextRun({ text: "A regression-based algorithmic software cost estimation model developed by Barry Boehm in 1981. It estimates Effort, Schedule, and Team Size based on project size (KLOC).", size: 22 })]),
      h3("COCOMO Levels:"),
      h3("1. Basic COCOMO"),
      p("Simple estimation based on size alone."),
      makeTable(
        ["Project Mode", "Effort Formula", "Schedule Formula", "Project Type"],
        [
          ["Organic", "E = 2.4 × (KLOC)^1.05", "T = 2.5 × E^0.38", "Small team, familiar domain"],
          ["Semi-detached", "E = 3.0 × (KLOC)^1.12", "T = 2.5 × E^0.35", "Medium team, mixed experience"],
          ["Embedded", "E = 3.6 × (KLOC)^1.20", "T = 2.5 × E^0.32", "Tight constraints, complex system"],
        ],
        [2000, 2600, 2000, 2400]
      ),
      p(""),
      h3("2. Intermediate COCOMO"),
      p("Adds 15 Cost Driver Attributes (multipliers) to basic COCOMO for more accurate estimates."),
      p("EAF (Effort Adjustment Factor) = product of all cost driver ratings."),
      p("E_adj = E_basic × EAF"),
      h3("3. Detailed COCOMO"),
      p("Applies cost drivers at individual phase level. Most accurate but requires detailed project information."),
      h3("Worked Example:"),
      para([new TextRun({ text: "Project: Payroll System, Size = 50 KLOC, Mode = Semi-Detached", bold: true, size: 22 })]),
      para([new TextRun({ text: "Effort = 3.0 × (50)^1.12", size: 22 })]),
      para([new TextRun({ text: "50^1.12 = 50 × 50^0.12 = 50 × 1.634 = 81.7", size: 22 })]),
      para([new TextRun({ text: "E = 3.0 × 81.7 = 245.1 person-months", size: 22 })]),
      para([new TextRun({ text: "T = 2.5 × (245.1)^0.35 = 2.5 × 7.89 = 19.7 months", size: 22 })]),
      para([new TextRun({ text: "People = 245.1 / 19.7 = 12.4 ≈ 13 people", size: 22 })]),

      // Q35
      pageBreak(),
      qHeader(35, "Software cost estimation: Function Point and Use Case Point estimation."),
      h3("Function Point Estimation (review):"),
      p("(See Q15 for detailed calculation. Key formula:)"),
      para([new TextRun({ text: "UFP = (EI × 4) + (EO × 5) + (EQ × 4) + (ILF × 10) + (EIF × 7)  [average weights]", font: "Courier New", size: 20 })]),
      para([new TextRun({ text: "AFP = UFP × (0.65 + 0.01 × ΣFi)", font: "Courier New", size: 20 })]),
      h3("Use Case Point (UCP) Estimation:"),
      para([bold("Definition: "), new TextRun({ text: "Use Case Point method estimates project size based on use cases and actors. Developed by Gustav Karner in 1993.", size: 22 })]),
      h3("Step 1: Unadjusted Actor Weight (UAW)"),
      makeTable(
        ["Actor Type", "Weight", "Description", "Example"],
        [
          ["Simple", "1", "External system with API", "Payment gateway API"],
          ["Average", "2", "System interacting via protocol", "Another application"],
          ["Complex", "3", "Human using UI", "End user/administrator"],
        ],
        [1800, 1200, 3300, 2700]
      ),
      p(""),
      h3("Step 2: Unadjusted Use Case Weight (UUCW)"),
      makeTable(
        ["Use Case Type", "Transactions", "Weight"],
        [
          ["Simple", "1-3 transactions", "5"],
          ["Average", "4-7 transactions", "10"],
          ["Complex", "> 7 transactions", "15"],
        ],
        [2500, 3500, 3000]
      ),
      p(""),
      h3("Step 3: Calculate UCP"),
      para([new TextRun({ text: "UUCP = UAW + UUCW", font: "Courier New", size: 20 })]),
      para([new TextRun({ text: "TCF = 0.6 + (0.01 × Σ Technical Complexity Factors)", font: "Courier New", size: 20 })]),
      para([new TextRun({ text: "ECF = 1.4 + (-0.03 × Σ Environmental Factors)", font: "Courier New", size: 20 })]),
      para([new TextRun({ text: "UCP = UUCP × TCF × ECF", font: "Courier New", size: 20 })]),
      para([new TextRun({ text: "Effort = UCP × Productivity Factor (typically 20 person-hours/UCP)", font: "Courier New", size: 20 })]),

      // Q36
      pageBreak(),
      qHeader(36, "Explain the Agile Development Model with suitable example."),
      para([bold("Definition: "), new TextRun({ text: "Agile is an iterative and incremental software development approach that delivers working software in short cycles called sprints (typically 2-4 weeks), emphasizing customer collaboration, flexibility, and rapid response to change.", size: 22 })]),
      h3("Agile Manifesto Values:"),
      bullet("Individuals and interactions OVER processes and tools"),
      bullet("Working software OVER comprehensive documentation"),
      bullet("Customer collaboration OVER contract negotiation"),
      bullet("Responding to change OVER following a plan"),
      h3("Scrum Framework (Most Popular Agile Method):"),
      makeTable(
        ["Element", "Description"],
        [
          ["Product Backlog", "Prioritized list of all features (user stories) to be built"],
          ["Sprint Planning", "Select top stories from backlog; plan the 2-week sprint"],
          ["Sprint", "2-4 week development iteration delivering potentially shippable product"],
          ["Daily Scrum", "15-min daily standup: What did I do? What will I do? Any blockers?"],
          ["Sprint Review", "Demo working software to stakeholders at end of sprint"],
          ["Sprint Retrospective", "Team reflects on process improvements for next sprint"],
        ],
        [2500, 6500]
      ),
      p(""),
      h3("Example: Developing a Food Delivery App with Agile"),
      makeTable(
        ["Sprint", "User Stories Delivered", "Duration"],
        [
          ["Sprint 1", "User registration, Login, Restaurant listing", "2 weeks"],
          ["Sprint 2", "Menu browsing, Add to cart, Remove from cart", "2 weeks"],
          ["Sprint 3", "Address selection, Order placement, Payment", "2 weeks"],
          ["Sprint 4", "Order tracking, Push notifications, Ratings", "2 weeks"],
          ["Sprint 5", "Order history, Coupons, Referral system", "2 weeks"],
        ],
        [1500, 5000, 2500]
      ),
      p(""),
      h3("Advantages:"),
      bullet("Early and frequent delivery of working software"),
      bullet("Accommodates changing requirements even late in development"),
      bullet("Close collaboration with customers"),
      bullet("Reduced risk through short iterations"),

      // Q37
      pageBreak(),
      qHeader(37, "Describe the qualities of a good software design with suitable examples."),
      p("(Detailed treatment. See also Q31.)"),
      makeTable(
        ["Quality", "Description", "Example"],
        [
          ["Correctness", "Design accurately implements all functional and non-functional requirements", "Auth module correctly validates JWT tokens per the security requirement"],
          ["Understandability", "Design is easy to comprehend by developers and maintainers", "Clear class names like 'OrderProcessor' instead of 'OPV2_final_v3'"],
          ["Efficiency", "Optimal use of time, memory, and other resources", "Using hash table (O(1) lookup) instead of list (O(n)) for user session management"],
          ["Reliability", "System behaves correctly even under unexpected conditions", "Payment module retries failed transactions 3 times before alerting user"],
          ["Maintainability", "Easy to modify, debug, and extend the system", "Changing tax calculation only requires updating one TaxCalculator class"],
          ["Reusability", "Components can be used in other contexts without modification", "A Logger utility class reused across 15 different microservices"],
          ["Scalability", "System can handle growth in users or data", "Stateless microservices that can be horizontally scaled by adding instances"],
          ["Flexibility", "Easy to add new features or change existing ones", "Strategy pattern allows adding new payment methods without changing core code"],
          ["Portability", "Software can run on different platforms", "Docker containerization allows deployment on AWS, Azure, or GCP"],
          ["Testability", "Design facilitates unit, integration, and system testing", "Dependency injection allows mocking database for isolated unit tests"],
        ],
        [2000, 3200, 3800]
      ),

      // Q38
      pageBreak(),
      qHeader(38, "Explain the terms Relationships: generalization, aggregation and composition."),
      h3("1. Generalization (Inheritance)"),
      para([bold("Definition: "), new TextRun({ text: "A relationship where a specialized class (child) inherits properties and behaviors from a general class (parent). Represents an 'IS-A' relationship.", size: 22 })]),
      bullet("Notation: Solid line with hollow arrowhead pointing to parent"),
      bullet("Child inherits all attributes and methods of parent"),
      bullet("Child can add new attributes/methods and override parent methods"),
      diagramBox("Generalization Example", [
        "            +----------+",
        "            |  Animal  |  (Parent/Superclass)",
        "            +----------+",
        "            | -name    |",
        "            | +eat()   |",
        "            | +breathe()|",
        "            +----------+",
        "                 /\\",
        "          ______/  \\______",
        "         /                \\",
        "    +-------+          +-------+",
        "    |  Dog  |          |  Cat  |   (Child/Subclass)",
        "    +-------+          +-------+",
        "    | +bark()|         | +meow()|",
        "    +-------+          +-------+",
        "",
        "Dog IS-A Animal; Cat IS-A Animal"
      ]),
      h3("2. Aggregation"),
      para([bold("Definition: "), new TextRun({ text: "A relationship where one class contains references to another class, but the contained objects can exist independently. Represents a 'HAS-A (weak)' or 'USES' relationship.", size: 22 })]),
      bullet("Notation: Line with hollow diamond on the container's end"),
      bullet("The contained object CAN exist without the container"),
      bullet("Example: A Department HAS-A Professor. If Department is deleted, Professor still exists."),
      diagramBox("Aggregation Example", [
        "+------------+         +-----------+",
        "| Department |<>-------| Professor |",
        "+------------+  1   *  +-----------+",
        "| -deptName  |         | -name     |",
        "+------------+         | -faculty  |",
        "                       +-----------+",
        "",
        "If Department is removed, Professor objects still exist"
      ]),
      h3("3. Composition"),
      para([bold("Definition: "), new TextRun({ text: "A strong form of aggregation where the contained objects CANNOT exist independently of the container. The container owns the contained objects.", size: 22 })]),
      bullet("Notation: Line with filled (solid) diamond on the container's end"),
      bullet("The contained object's lifecycle depends on the container"),
      bullet("Example: A House HAS Rooms. If House is deleted, Rooms cease to exist."),
      diagramBox("Composition Example", [
        "+----------+          +--------+",
        "|  House   |<*>-------|  Room  |",
        "+----------+  1    *  +--------+",
        "| -address |          | -size  |",
        "+----------+          | -type  |",
        "                      +--------+",
        "",
        "If House is destroyed, Rooms are destroyed too"
      ]),
      makeTable(
        ["Relationship", "Symbol", "Dependency", "Example"],
        [
          ["Generalization", "Hollow arrowhead", "IS-A", "Car IS-A Vehicle"],
          ["Aggregation", "Hollow diamond", "HAS-A (weak)", "Team HAS Players"],
          ["Composition", "Filled diamond", "HAS-A (strong)", "Human HAS Heart"],
        ],
        [2000, 2000, 2000, 3000]
      ),

      // Q39
      pageBreak(),
      qHeader(39, "Draw an Activity Diagram for Restaurant food ordering system."),
      h3("Activities and Swimlanes:"),
      p("Actors: Customer, Waiter, Kitchen, Cashier"),
      diagramBox("Activity Diagram - Restaurant Food Ordering System", [
        "Customer          Waiter              Kitchen          Cashier",
        "   |                 |                   |                |",
        "   | Enter/Sit       |                   |                |",
        "   |                 |                   |                |",
        "[Seated]         [Greet Customer]         |                |",
        "   |<----- Menu -----|                   |                |",
        "   |                 |                   |                |",
        "[Browse Menu]        |                   |                |",
        "   |                 |                   |                |",
        "[Place Order] ------>|                   |                |",
        "                 [Take Order]            |                |",
        "                     |---- Send Order -->|                |",
        "                     |               [Prepare Food]       |",
        "                     |               [Cook Food]          |",
        "                     |<----- Ready --|                    |",
        "                 [Serve Food]            |                |",
        "                     |                   |                |",
        "[Eat Food] <---------|                   |                |",
        "   |                 |                   |                |",
        "[Request Bill] ----->|                   |                |",
        "                 [Generate Bill] ------->|--------------->|",
        "                                         |           [Calculate Total]",
        "   |<------------------------------ Bill--|",
        "[Review Bill]        |                   |                |",
        "[Make Payment] ----------------------->  |           [Process Payment]",
        "                                                     [Print Receipt]",
        "   |<----------------------------------- Receipt ---------|",
        "[Leave]"
      ]),
      h3("Decision Nodes in Activity Diagram:"),
      bullet("After viewing menu: [Has questions?] → Yes: Ask waiter | No: Place order"),
      bullet("After receiving bill: [Payment method?] → Cash/Card/UPI → respective processing"),
      bullet("Payment validation: [Payment successful?] → Yes: Receipt | No: Retry"),

      // Q40
      pageBreak(),
      qHeader(40, "Explain the characteristics of TRELLO and JIRA."),
      h3("TRELLO:"),
      para([bold("Definition: "), new TextRun({ text: "Trello is a visual, card-based project management tool built on the Kanban methodology. Owned by Atlassian.", size: 22 })]),
      makeTable(
        ["Characteristic", "Description"],
        [
          ["Visual Kanban Boards", "Drag-and-drop cards across lists (columns) like Backlog, In Progress, Done"],
          ["Cards", "Each task is a card with title, description, checklists, attachments, due dates"],
          ["Lists", "Columns representing stages of work (configurable to any workflow)"],
          ["Labels & Tags", "Color-coded labels for priority, category, or team"],
          ["Power-Ups (Integrations)", "Connect with Slack, Google Drive, GitHub, Calendar, time trackers"],
          ["Team Collaboration", "Assign members to cards, add comments, mention teammates with @"],
          ["Simplicity", "Minimal learning curve; suitable for small teams and non-technical users"],
          ["Mobile App", "Full-featured iOS and Android apps for on-the-go management"],
          ["Templates", "Pre-built boards for common use cases (Agile, Marketing, Onboarding)"],
          ["Free Tier", "Generous free plan for small teams; Premium for advanced features"],
        ],
        [2500, 6500]
      ),
      p(""),
      h3("JIRA:"),
      para([bold("Definition: "), new TextRun({ text: "JIRA (formerly written as JIRA) is an enterprise-grade project and issue tracking tool by Atlassian, widely used for Agile software development.", size: 22 })]),
      makeTable(
        ["Characteristic", "Description"],
        [
          ["Issue Tracking", "Track bugs, user stories, tasks, epics, and sub-tasks with full detail"],
          ["Agile Support", "Supports Scrum (sprints, burndown charts) and Kanban (flow metrics)"],
          ["Epics & Stories", "Hierarchical: Epics → Stories → Sub-tasks for complex feature management"],
          ["Custom Workflows", "Define custom issue states and transitions (e.g., Open → Dev → QA → Done)"],
          ["Sprint Management", "Plan sprints, set capacity, track velocity across sprints"],
          ["Advanced Reporting", "Burndown charts, velocity charts, sprint reports, release burndown"],
          ["JQL (Query Language)", "JIRA Query Language for powerful custom filtering and reporting"],
          ["Roadmaps", "Visual timeline of epics and feature releases for stakeholders"],
          ["Integration", "Deep integration with Bitbucket, Confluence, GitHub, Jenkins, Slack"],
          ["Permissions", "Granular role-based access control for enterprise environments"],
          ["Automation", "Auto-assign issues, trigger notifications, update fields based on rules"],
        ],
        [2500, 6500]
      ),
      p(""),
      h3("TRELLO vs JIRA Comparison:"),
      makeTable(
        ["Feature", "Trello", "JIRA"],
        [
          ["Best For", "Small teams, simple projects", "Large teams, complex software projects"],
          ["Learning Curve", "Very low", "Moderate to high"],
          ["Methodology", "Primarily Kanban", "Scrum, Kanban, hybrid"],
          ["Reporting", "Basic", "Advanced (burndown, velocity, etc.)"],
          ["Customization", "Limited", "Highly customizable"],
          ["Price", "Free tier + affordable plans", "More expensive at scale"],
        ],
        [2500, 3000, 3500]
      ),

      // FINAL PAGE
      pageBreak(),
      new Paragraph({
        children: [new TextRun({ text: "QUICK REFERENCE - KEY FORMULAS", bold: true, size: 32, color: "1F3864" })],
        alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 }
      }),
      makeTable(
        ["Formula/Concept", "Expression"],
        [
          ["Function Points (UFP)", "UFP = (EI×EI_wt) + (EO×EO_wt) + (EQ×EQ_wt) + (ILF×ILF_wt) + (EIF×EIF_wt)"],
          ["Value Adjustment Factor", "VAF = 0.65 + (0.01 × ΣFi)"],
          ["Adjusted FP", "AFP = UFP × VAF"],
          ["COCOMO Effort (Organic)", "E = 2.4 × (KLOC)^1.05 person-months"],
          ["COCOMO Schedule (Organic)", "T = 2.5 × E^0.38 months"],
          ["COCOMO Persons", "P = E / T"],
          ["PERT Expected Time", "Te = (O + 4M + P) / 6"],
          ["PERT Variance", "σ² = ((P - O) / 6)²"],
          ["Risk Exposure", "RE = Probability × Impact"],
          ["Defect Density", "DD = Total Defects / KLOC"],
        ],
        [3000, 6000]
      ),
      p(""),
      new Paragraph({
        children: [new TextRun({ text: "Good luck with your exam!", bold: true, size: 28, color: "2E75B6", italics: true })],
        alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('Software_Engineering_Study_Guide.docx', buffer);
  console.log('Document created successfully!');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});