/* ============================================================================
   Manifest of guideline tools shown on the homepage.
   To add a new tool:
     1. Copy the _template/ folder to a new folder named after your tool's
        slug (kebab-case — this becomes the URL path).
     2. Build out its index.html / app.js (see _template/README.md).
     3. Add an entry to the TOOLS array below.
   ============================================================================ */

window.TOOLS = [
  {
    slug: "miscarriage-management",
    title: "Miscarriage Management",
    description: "Step-by-step decision support for expectant, medical and surgical management of miscarriage.",
    guidelineTitle: "Miscarriage: Management – Guideline",
    guidelineRef: "RWH0193330 v4.0",
    lastUpdated: "15/07/2025",
    department: "Early Pregnancy Assessment Service (EPAS)",
    status: "live", // "live" | "draft" | "planned"
    path: "miscarriage-management/"
  },
  {
    slug: "pain-bleeding-early-pregnancy",
    title: "Pain and Bleeding in Early Pregnancy",
    description: "Step-by-step initial assessment, red flags and triage (urgent, admit, EPAS referral or discharge) for pain and/or bleeding up to 13+6 weeks.",
    guidelineTitle: "Pain and Bleeding in Early Pregnancy – Guideline",
    guidelineRef: "RWH0192464 v3.0",
    lastUpdated: "30/03/2023",
    department: "Early Pregnancy Assessment Service (EPAS)",
    status: "live", // "live" | "draft" | "planned"
    path: "pain-bleeding-early-pregnancy/"
  },
  {
    slug: "ectopic-pregnancy-management",
    title: "Ectopic Pregnancy Management",
    description: "Step-by-step selection of surgical, methotrexate or expectant management for tubal ectopic pregnancy, with dose calculation and follow-up.",
    guidelineTitle: "Ectopic Pregnancy Management – Guideline",
    guidelineRef: "RWH0192462 v4.0",
    lastUpdated: "01/05/2026",
    department: "Early Pregnancy Assessment Service (EPAS)",
    status: "live", // "live" | "draft" | "planned"
    path: "ectopic-pregnancy-management/"
  },
  {
    slug: "rhd-immunoglobulin",
    title: "RhD Immunoglobulin (Anti-D)",
    description: "Whether RhD-Ig is indicated, and the dose, product, route, FMH testing and checks, for routine prophylaxis, sensitising events and birth.",
    guidelineTitle: "RhD Immunoglobulin (Anti D) Use in Maternity – Guideline",
    guidelineRef: "RWH0191940 v3.0",
    lastUpdated: "14/09/2026",
    department: "Maternity Services",
    status: "live", // "live" | "draft" | "planned"
    path: "rhd-immunoglobulin/"
  }

  // Example entry for the next tool:
  // {
  //   slug: "your-tool-slug",
  //   title: "Your Guideline Title",
  //   description: "One sentence describing what the tool helps decide.",
  //   guidelineTitle: "Full Guideline Title – Guideline",
  //   guidelineRef: "RWH-XXXXXXX vX.X",
  //   lastUpdated: "DD/MM/YYYY",
  //   department: "Owning department/service",
  //   status: "live",
  //   path: "your-tool-slug/"
  // }
];
