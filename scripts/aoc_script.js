const areas = {
    law: {
      title: "Land, Air, and Water",
      required: ["CHEM_V 123", "ENVR_V 420", "EOSC_V 211"],
      oneOf: [
        ["APBI_V 200", "ATSC_V 201", "EOSC_V 220", "EOSC_V 221", "EOSC_V 222", "EOSC_V 270", "GEOS_V 200", "GEOS_V 206"]
      ],
      threeOf: [
        "CHEM_V 301", "CHEM_V 302", "GEOS_V 300", "GEOS_V 304", "GEOS_V 305", "GEOS_V 308", "GEOS_V 309",
        "GEOS_V 400", "GEOS_V 401", "GEOS_V 402", "GEOS_V 403", "GEOS_V 405", "GEOS_V 406", "GEOS_V 408",
        "GEOS_V 409", "GEOS_V 415", "GEOG_V 412",
        "Any 300-level or 400-level ATSC_V or EOSC_V course"
      ]
    },

    ecology: {
      title: "Ecology and Conservation",
      required: ["BIOL_V 230", "CONS_V 200", "ENVR_V 430", "ENVR_V 440"],
      threeOf: [
        "APBI_V 200", "APBI_V 342", "APBI_V 401", "APBI_V 423", "BIOL_V 203", "BIOL_V 204", "BIOL_V 205", "BIOL_V 209",
        "BIOL_V 210", "BIOL_V 302", "BIOL_V 303", "BIOL_V 314", "BIOL_V 320", "BIOL_V 324", "BIOL_V 327", "BIOL_V 328",
        "BIOL_V 336", "BIOL_V 403", "BIOL_V 406", "BIOL_V 408", "BIOL_V 409", "BIOL_V 411", "BIOL_V 412", "BIOL_V 413",
        "BIOL_V 416", "BIOL_V 418", "BIOL_V 420", "BIOL_V 424", "BIOL_V 425", "BIOL_V 427", "BIOL_V 437", "EOSC_V 372",
        "EOSC_V 373", "EOSC_V 470", "EOSC_V 475", "EOSC_V 478", "GEOG_V 318", "GEOS_V 204", "GEOS_V 207", "GEOS_V 303",
        "GEOS_V 306", "GEOS_V 307", "GEOS_V 407", "GEOS_V 415", "MICB_V 301", "UFOR_V 403"
      ]
    },

    energy: {
      title: "Energy Transitions and Sustainability",
      required: ["ENVR_V 410", "ENVR_V 440", "PHYS_V 333"],
      oneOf: [
        ["ARCL_V 309", "ASIC_V 220", "CONS_V 425", "DES_V 230", "ENVR_V 430", "GEOG_V 302", "GEOG_V 310",
        "GEOG_V 318", "ISCI_V 360", "POLI_V 351", "POLI_V 375A", "SCIE_V 420", "SOCI_V 230"]
      ],
      threeOf: [
        "APSC_V 366", "ATSC_V 313", "BEST_V 202", "BEST_V 301", "BEST_V 401", "BEST_V 402", "CHBE_V 482", "CHBE_V 483",
        "CHBE_V 473", "CHBE_V 488", "CHEM_V 341", "ECON_V 471", "FRE_V 374", "FRST_V 101", "LFS_V 101"
      ]
    },

    health: {
      title: "Environmental Impacts on Human Health",
      required: ["CHEM_V 123", "SPPH_V 303"],
      oneOf: [
        ["BIOL_V 201", "BIOC_V 202", "CHEM_V 203", "CHEM_V 205", "CHEM_V 233"]
      ],
      fourOf: [
        "BIOL_V 302", "BIOL_V 314", "BIOL_V 328", "BIOL_V 403", "CHEM_V 302", "CHEM_V 341", "CIVL_V 201", "EOSC_V 474",
        "GEOS_V 402", "MECH_V 411", "MICB_V 211", "SPPH_V 301"
      ]
    },

    analytics: {
      title: "Environmental Analytics",
      required: ["CPSC_V 203"],
      oneOf: [
        ["CPSC_V 103", "EOSC_V 211"],
        ["EOSC_V 410", "EOSC_V 440"]
      ],
      fourOf: [
        "ATSC_V 409", "BIOL_V 301", "CPSC_V 330", "CPSC_V 430", "DSCI_V 310", "DSCI_V 320", "DSCI_V 430", "EOSC_V 250",
        "EOSC_V 354", "EOSC_V 410", "EOSC_V 440", "EOSC_V 471", "FRE_V 326", "FRE_V 474", "FRE_V 490", "GEOS_V 370",
        "GEOS_V 373", "MATH_V 200", "MATH_V 215", "MATH_V 221", "MATH_V 255", "STAT_V 301"
      ]
    }
  };

let courseDescriptions = {};

fetch('../data/aoc_courses.json')
  .then(response => response.json())
  .then(data => {
    courseDescriptions = data.reduce((acc, course) => {
      acc[course.course_code] = {
        title: course.course_title,
        desc: course.course_desc
      };
      return acc;
    }, {});
  })
  .catch(error => console.error('Error loading course descriptions:', error));


const buttonsDiv = document.getElementById("aocButtons");
const courseGrid = document.getElementById("courseGrid");

function renderButtons() {
  Object.entries(areas).forEach(([key, area]) => {
    const btn = document.createElement("button");
    btn.className = "aoc-button";
    btn.innerText = area.title;
    btn.onclick = () => {
      const isActive = btn.classList.contains("active");

      // Remove active class from all buttons
      document.querySelectorAll(".aoc-button").forEach(b => b.classList.remove("active"));

      if (isActive) {
        // Reset to default state
        currentKey = null;
        courseGrid.innerHTML = "";
        searchAlert.style.display = currentSearch.length > 0 ? "block" : "none";
        if (currentSearch.length > 0) {
          searchAlert.textContent = "Please select an area of concentration to view courses.";
          searchAlert.classList.remove("green");
          searchAlert.classList.add("red");
        }
      } else {
        // Activate new button and render
        btn.classList.add("active");
        currentKey = key;
        renderCourses(key);

        if (currentSearch.length > 0) {
          searchAlert.textContent = "Clear the search bar to view all courses.";
          searchAlert.classList.remove("red");
          searchAlert.classList.add("green");
          searchAlert.style.display = "block";
        }
      }
    };
    buttonsDiv.appendChild(btn);
  });
}

function renderCourses(key) {
  courseGrid.innerHTML = "";
  const area = areas[key];

  const createColumn = (title, content) => {
    const col = document.createElement("div");
    col.className = "course-column";

    const heading = document.createElement("h3");
    heading.textContent = title;
    col.appendChild(heading);

    content.flat().filter(course => course.toLowerCase().includes(currentSearch)).forEach(course => {
      const box = document.createElement("div");
      box.className = "course-box";

      const titleEl = document.createElement("div");
      titleEl.className = "course-title";
      const courseData = courseDescriptions[course];

      titleEl.textContent = courseData
        ? `${course} - ${courseData.title}`
        : course;

      const descEl = document.createElement("div");
      descEl.className = "course-desc";
      descEl.textContent = courseData
        ? courseData.desc
        : "Description not available.";


      box.appendChild(titleEl);
      box.appendChild(descEl);
      col.appendChild(box);
    });

    return col;
  };

  if (area.required?.length > 0)
    courseGrid.appendChild(createColumn("Required Courses", area.required));

  if (Array.isArray(area.oneOf))
    area.oneOf.forEach((group, index) => {
      courseGrid.appendChild(createColumn("Choose One of the Following", [group]));
    });

  if (Array.isArray(area.threeOf) && area.threeOf.length > 0)
    courseGrid.appendChild(createColumn("Choose Three of the Following", area.threeOf));

  if (Array.isArray(area.fourOf) && area.fourOf.length > 0)
    courseGrid.appendChild(createColumn("Choose Four of the Following", area.fourOf));
}

renderButtons();

let currentKey = null;
let currentSearch = "";

const searchInput = document.getElementById("courseSearch");
const searchAlert = document.getElementById("searchAlert");

searchInput.addEventListener("input", (e) => {
  currentSearch = e.target.value.toLowerCase();

  if (currentSearch.length > 0) {
    searchAlert.classList.remove("red", "green");

    if (!currentKey) {
      searchAlert.textContent = "Please select an area of concentration to view courses.";
      searchAlert.classList.add("red");
    } else {
      searchAlert.textContent = "Clear the search bar to view all courses.";
      searchAlert.classList.add("green");
    }
    searchAlert.style.display = "block";
  } else {
    searchAlert.style.display = "none";
  }

  if (currentKey) renderCourses(currentKey);
});