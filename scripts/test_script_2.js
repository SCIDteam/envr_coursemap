let courses = {};
let currentSearch = "";

const courseGrid   = document.getElementById("courseGrid");
const searchInput  = document.getElementById("courseSearch");
const searchAlert  = document.getElementById("searchAlert");

const COURSES_BY_YEAR = {
  1: [
    "BIOL_V 121",
    "ENVR_V 100",
    ["CHEM_V 121", "CHEM_V 111", "CHEM_V 141"],
    "SCIE_V 113",
    "DSCI_V 100",
    ["MATH_V 100", "MATH_V 180", "MATH_V 184", "MATH_V 120"],
    ["MATH_V 101", "MATH_V 121"],
    "3 Credits of PHYS 100-level (Excluding PHYS 100 and PHYS 170)",   // any first-year PHYS_V course
    "5 Credits of Electives"
  ],

  2: [
    "ENVR_V 200",
    "ENVR_V 205",
    "ENVR_V 240",
    "EOSC_V 340",
    "3 Credits of Tools Elective (Before 4th year)",
    "6 Credits of Area of Concentration Courses",
    ["STAT_V 200", "STAT_V 201", "BIOL_V 300"],
    "8 Credits of Electives"
  ],

  "3/4": [
    "ENVR_V 300",
    "ENVR_V 305",
    "ENVR_V 350",
    "ENVR_V 400",
    "ENVR_V 450",
    "EOSC_V 345",
    "12 Credits of Complementary Studies Courses",
    "17 Credits of Area of Concentration Courses",
    "17 Credits of Electives"
  ]
};

const wantedCodes = new Map();              // key: normalised, value: original

function normalise(code) {
  return code.replace(/_V/, "").trim();     // CHEM_V 121 → CHEM 121
}

Object.values(COURSES_BY_YEAR).flat().forEach(item => {
  const collect = code => {
    if (/^[A-Z]{4}(?:_V)? \d{3}$/.test(code.trim())) {
      wantedCodes.set(normalise(code), code.trim());
    }
  };
  Array.isArray(item) ? item.forEach(collect) : collect(item);
});


Promise.all([
  fetch("../data/envr_major_core.json").then(r => r.json()),
  fetch("../data/new_courses_info.json").then(r => r.json())
])
.then(([coreData, newInfoData]) => {
  // 1. First pass – create objects from envr_major_core.json
  coreData.forEach(course => {
    const norm = normalise(course.course_code);
    if (!wantedCodes.has(norm)) return;               // ignore electives etc.

    const key = wantedCodes.get(norm);
    courses[key] = {
      code:  course.course_code,
      title: course.course_title || "",               // may be empty
      desc:  course.description  || "",
      prereqs: Array.isArray(course.prerequisites) ? course.prerequisites : [],
      coreqs: Array.isArray(course.corequisites)   ? course.corequisites   : []
    };
  });

  // 2. Second pass – merge in richer data from new_courses_info.json
  newInfoData.forEach(course => {
    const norm = normalise(course.course_code);
    if (!wantedCodes.has(norm)) return;

    const key = wantedCodes.get(norm);
    const existing = courses[key];

    if (existing) {
      // fill only the blanks
      if (!existing.title && course.course_title)
        existing.title = course.course_title;

      if (!existing.desc && course.description)
        existing.desc = course.description;

      if (
        existing.prereqs.length === 0 &&
        Array.isArray(course.prerequisites) &&
        course.prerequisites.length
      ) {
        existing.prereqs = course.prerequisites;
      }

      if (
        existing.coreqs.length === 0 &&
        Array.isArray(course.corequisites) &&
        course.corequisites.length
      ) {
        existing.coreqs = course.corequisites;
      }
    } else {
      // course was not in envr_major_core.json, add it now
      courses[key] = {
        code:  course.course_code,
        title: course.course_title || "",
        desc:  course.description  || "",
        prereqs: Array.isArray(course.prerequisites) ? course.prerequisites : [],
        coreqs: Array.isArray(course.corequisites)   ? course.corequisites   : []
      };
    }
  });

  renderCourses();
})
.catch(err => console.error("Error loading courses:", err));

// 2) Re‐render whenever the search input changes
searchInput.addEventListener("input", e => {
  currentSearch = e.target.value.trim().toLowerCase();
  renderCourses();
  // show or hide the "clear to view all" alert
  if (currentSearch === "") {
    searchAlert.style.display = "block";
  } else {
    searchAlert.style.display = "none";
  }
});


// 3) Render helper: one column, filtering by currentSearch
function renderCourses() {
  courseGrid.innerHTML = "";           // clear previous view

  const yearCols = [
    { key: "1",   label: "First Year" },
    { key: "2",   label: "Second Year" },
    { key: "3/4", label: "Third & Fourth Years" }
  ];

  // normalise search term once
  const term = currentSearch ?? "";
  const hasSearch = term !== "";

  // helper: should a code appear under the current search?
  function matchesSearch(codeObj) {
    if (!hasSearch) return true;
    // for real courses lookup extra fields; placeholders just match code
    const { code, title = "", desc = "" } = codeObj;
    return (
      code.toLowerCase().includes(term) ||
      title.toLowerCase().includes(term) ||
      desc.toLowerCase().includes(term)
    );
  }

  // helper: slice to “Prerequisite …” if it exists
  function prereqSnippet(full) {
    const idx = full.search(/Prerequisite|Not Open/i);
    return idx >= 0 ? full.slice(idx) : "";
  }

  function openToolsPopup() {                               // NEW
    // build overlay
    const overlay = document.createElement("div");
    overlay.className = "popup2-overlay";

    // close on click outside content
    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.remove();
    });

    // popup content
    const popup = document.createElement("div");
    popup.className = "popup2";

    const blurb = document.createElement("p");
    blurb.textContent =
      "Students should choose one of the following tools electives and it must be completed before 4th year.";
    popup.appendChild(blurb);

    // list of tools-elective course codes
    const toolCodes = [
      "ATSC_V 303",
      "CHEM_V 211",
      "CHEM_V 311",
      "EOSC_V 211",
      "GEOS_V 270",
      "GEOS_V 309",
      "GEOS_V 370",
      "GEOS_V 373",
      "NRES_V 241",
      "NRES_V 340",
      "NRES_V 341"
    ];

    toolCodes.forEach(code => {
      const data = courses[code] || { code };       // pull from existing lookup if present
      const box  = document.createElement("div");
      box.className = "course-box popup2-box";       // reuse styling

      const title = document.createElement("div");
      title.className = "course-title";
      title.textContent = data.code + (data.title ? " – " + data.title : "");
      box.appendChild(title);

      const desc = document.createElement("div");
      desc.className = "course-desc";
      desc.textContent = prereqSnippet(data.desc || "");
      box.appendChild(desc);

      popup.appendChild(box);
    });

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }

  yearCols.forEach(({ key, label }) => {
    // ▸ gather the list of codes for the column, flattening any one-of arrays
    const rawItems = COURSES_BY_YEAR[key] || [];
    const codes = rawItems.flatMap(item => Array.isArray(item) ? item : [item]);

    // ▸ build column element
    const col = document.createElement("div");
    col.className = "course-column";

    // heading + expand
    col.innerHTML = `
      <div class="column-header">
        <h3>${label}</h3>
        <button class="expand-btn" title="Expand">&#x26F6;</button>
      </div>
    `;

    // ▸ add each course box
    rawItems.forEach(item => {

      /* ── A) LIST  ➔ one big dashed wrapper ───────────────────── */
      if (Array.isArray(item)) {
        const group = document.createElement("div");
        group.className = "choice-group";            //  dashed outline

        const label = document.createElement("div");
        label.className = "choice-label";
        label.textContent = "Choose one of:";
        group.appendChild(label);

        item.forEach(codeStr => {
          const courseData = courses[codeStr] || { code: codeStr };
          if (!matchesSearch(courseData)) return;     // search filter

          const box = document.createElement("div");
          box.className    = "course-box";
          box.dataset.code = codeStr;                 // key for popup

          const titleEl = document.createElement("div");
          titleEl.className = "course-title";
          titleEl.textContent =
            `${courseData.code}${courseData.title ? " – " + courseData.title : ""}`;
          box.appendChild(titleEl);

          const descEl = document.createElement("div");
          descEl.className = "course-desc";
          descEl.textContent = prereqSnippet(courseData.desc || "");
          box.appendChild(descEl);

          group.appendChild(box);
        });

        // only append if at least one child survived the search
        if (group.querySelector(".course-box"))
          col.appendChild(group);

      /* ── B) SINGLE required course ───────────────────────────── */
      } else {
          if (typeof item === "string" && item.includes("Tools Elective")) {   // NEW
            const box = document.createElement("div");
            box.className = "course-box";
            box.dataset.code = "TOOLS_ELECTIVE";

            const titleEl = document.createElement("div");
            titleEl.className = "course-title";
            titleEl.textContent = "Tools Elective";
            box.appendChild(titleEl);

            const descEl = document.createElement("div");
            descEl.className = "course-desc";
            descEl.textContent = "Click to see more information.";
            box.appendChild(descEl);

            // open popup on click
            box.addEventListener("click", openToolsPopup);                      // NEW

            col.appendChild(box);
            return; // skip the normal course rendering branch
          }
        const codeStr    = item;
        const courseData = courses[codeStr] || { code: codeStr };
        if (!matchesSearch(courseData)) return;

        const box = document.createElement("div");
        box.className    = "course-box";
        box.dataset.code = codeStr;

        const titleEl = document.createElement("div");
        titleEl.className = "course-title";
        titleEl.textContent =
          `${courseData.code}${courseData.title ? " – " + courseData.title : ""}`;
        box.appendChild(titleEl);

        const descEl = document.createElement("div");
        descEl.className = "course-desc";
        descEl.textContent = prereqSnippet(courseData.desc || "");
        box.appendChild(descEl);

        col.appendChild(box);
      }
    });

    // ▸ attach expand-popup behaviour
    col.querySelector(".expand-btn").addEventListener("click", () => {
      const overlay = document.createElement("div");
      overlay.className = "popup-overlay";

      const pop = document.createElement("div");
      pop.className = "popup course-column";
      pop.innerHTML = col.innerHTML;   // clone header & boxes

      pop.querySelectorAll(".course-box").forEach(box => {
          const code      = box.dataset.code;   // ← always matches `courses`
          const course    = courses[code] || {};

          // update *title* in case it was missing earlier
          const titleEl   = box.querySelector(".course-title");
          titleEl.textContent =
            `${course.code || code}${course.title ? " – " + course.title : ""}`;

          // add full description
          const descEl    = box.querySelector(".course-desc");
          descEl.textContent = course.desc || "";
        });

      // close button
      const close = document.createElement("button");
      close.className = "close-btn";
      close.innerHTML = "✕";
      close.addEventListener("click", () => document.body.removeChild(overlay));
      pop.appendChild(close);

      overlay.appendChild(pop);
      document.body.appendChild(overlay);
    });

    courseGrid.appendChild(col);
  });
}