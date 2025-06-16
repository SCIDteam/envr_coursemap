const $ = id => document.getElementById(id);
const courseGrid  = $("courseGrid"),
      searchInput = $("courseSearch"),
      searchAlert = $("searchAlert");

const COURSES_BY_YEAR = {
  1: [
    "BIOL_V 121",
    "ENVR_V 100",
    ["CHEM_V 121", "CHEM_V 111", "CHEM_V 141"],
    "SCIE_V 113",
    "DSCI_V 100",
    ["MATH_V 100", "MATH_V 180", "MATH_V 184", "MATH_V 120"],
    ["MATH_V 101", "MATH_V 121"],
    "3 Credits of PHYS 100-level (Excluding PHYS 100 and PHYS 170)",
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

const normalise = c => c.replace(/_V/, "").trim();
const wantedCodes = new Map(
  Object.values(COURSES_BY_YEAR)
    .flat()
    .flatMap(i => (Array.isArray(i) ? i : [i]))
    .filter(c => /^[A-Z]{4}(?:_V)? \d{3}$/.test(c.trim()))
    .map(c => [normalise(c), c.trim()])
);
const courses = {};
let currentSearch = "";

function updateCourse({course_code, course_title = "", description = "", prerequisites = [], corequisites = []}) {
  const norm = normalise(course_code);
  if (!wantedCodes.has(norm)) return;
  const key = wantedCodes.get(norm);
  const c = courses[key] || (courses[key] = { code: course_code, title: "", desc: "", prereqs: [], coreqs: [] });
  if (!c.title && course_title) c.title = course_title;
  if (!c.desc && description) c.desc = description;
  if (!c.prereqs.length && Array.isArray(prerequisites) && prerequisites.length) c.prereqs = prerequisites;
  if (!c.coreqs.length && Array.isArray(corequisites) && corequisites.length) c.coreqs = corequisites;
}

Promise.all([
  fetch("../data/envr_major_core.json").then(r => r.json()),
  fetch("../data/new_courses_info.json").then(r => r.json())
])
  .then(([core, info]) => {
    core.forEach(updateCourse);
    info.forEach(updateCourse);
    renderCourses();
  })
  .catch(e => console.error("Error loading courses:", e));

searchInput.addEventListener("input", e => {
  currentSearch = e.target.value.trim().toLowerCase();
  renderCourses();
  searchAlert.style.display = currentSearch ? "none" : "block";
});

function renderCourses() {
  courseGrid.innerHTML = "";
  const term = currentSearch;
  const hasSearch = term !== "";

  const matchesSearch = ({ code, title = "", desc = "" }) =>
    !hasSearch ||
    code.toLowerCase().includes(term) ||
    title.toLowerCase().includes(term) ||
    desc.toLowerCase().includes(term);

  const prereqSnippet = txt => {
    const i = txt.search(/Prerequisite|Not Open/i);
    return i >= 0 ? txt.slice(i) : "";
  };

  const makeBox = (code, extra = "") => {
    const data = courses[code] || { code };
    if (!matchesSearch(data)) return null;
    const box = document.createElement("div");
    box.className = "course-box" + (extra ? " " + extra : "");
    box.dataset.code = code;
    box.innerHTML = `<div class="course-title">${data.code}${data.title ? " – " + data.title : ""}</div>` +
                    `<div class="course-desc">${prereqSnippet(data.desc || "")}</div>`;
    return box;
  };

  const openToolsPopup = () => {
    const overlay = document.createElement("div");
    overlay.className = "popup2-overlay";
    overlay.addEventListener("click", e => e.target === overlay && overlay.remove());

    const popup = document.createElement("div");
    popup.className = "popup2";
    popup.innerHTML = `<p>Students should choose one of the following tools electives and it must be completed before 4th year.</p>`;
    [
      "ATSC_V 303","CHEM_V 211","CHEM_V 311","EOSC_V 211","GEOS_V 270",
      "GEOS_V 309","GEOS_V 370","GEOS_V 373","NRES_V 241","NRES_V 340","NRES_V 341"
    ].forEach(c => popup.appendChild(makeBox(c, "popup2-box")));
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  };

  [
    { key: "1",   label: "First Year" },
    { key: "2",   label: "Second Year" },
    { key: "3/4", label: "Third & Fourth Years" }
  ].forEach(({ key, label }) => {
    const raw = COURSES_BY_YEAR[key] || [];
    const col = document.createElement("div");
    col.className = "course-column";
    col.innerHTML =
      `<div class="column-header"><h3>${label}</h3><button class="expand-btn" title="Expand">&#x26F6;</button></div>`;

    raw.forEach(item => {
      if (Array.isArray(item)) {
        const group = document.createElement("div");
        group.className = "choice-group";
        group.innerHTML = '<div class="choice-label">Choose one of:</div>';
        item.forEach(c => {
          const b = makeBox(c);
          if (b) group.appendChild(b);
        });
        if (group.querySelector(".course-box")) col.appendChild(group);
      } else if (typeof item === "string" && item.includes("Tools Elective")) {
        const b = document.createElement("div");
        b.className = "course-box";
        b.dataset.code = "TOOLS_ELECTIVE";
        b.innerHTML = '<div class="course-title">Tools Elective</div><div class="course-desc">Click to see more information.</div>';
        b.addEventListener("click", openToolsPopup);
        col.appendChild(b);
      } else {
        const b = makeBox(item);
        if (b) col.appendChild(b);
      }
    });

    col.querySelector(".expand-btn").addEventListener("click", () => {
      const overlay = document.createElement("div");
      overlay.className = "popup-overlay";

      const pop = document.createElement("div");
      pop.className = "popup course-column";
      pop.innerHTML = col.innerHTML;

      pop.querySelectorAll(".course-box").forEach(box => {
        const code = box.dataset.code;
        const c = courses[code] || {};
        box.querySelector(".course-title").textContent =
          `${c.code || code}${c.title ? " – " + c.title : ""}`;
        box.querySelector(".course-desc").textContent = c.desc || "";
      });

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
