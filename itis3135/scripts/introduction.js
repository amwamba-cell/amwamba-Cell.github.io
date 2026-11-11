"use strict";
const bulletLabels = ["Personal Background", "Professional Background", "Academic Background", "Primary Work Computer", "Primary Work Location", "Alternate Computer &amp; Location"];
const form = document.getElementById("introduction-form");
const courses = document.getElementById("courses");
const initialCourses = courses.innerHTML;
const result = document.getElementById("introduction-result");
const output = document.getElementById("generated-output");
let imageRead = Promise.resolve(null);
const escapeCode = (value) => String(value).replace(/[&<>"']/g, (character) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[character]));
const safeUrl = (value) => /^(https?:\/\/|images\/|\.\.\/|\.\/|data:image\/(png|jpeg|gif|webp);base64,)/i.test(value) ? value : "";
form.upload.addEventListener("change", () => {
    const file = form.upload.files[0];
    imageRead = !file ? Promise.resolve(null) : new Promise((resolve) => {
        if (!file.type.startsWith("image/")) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
});
async function collectData() {
    if (!document.querySelector("footer")) {
        await new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                if (document.querySelector("footer")) { observer.disconnect(); resolve(); }
            });
            observer.observe(document.body, {childList: true, subtree: true});
        });
    }
    const data = Object.fromEntries(new FormData(form));
    data.picture = await imageRead || data.picture;
    data.courses = [...courses.querySelectorAll(".course")].map((row) => Object.fromEntries([...row.querySelectorAll("input")].map((input) => [input.dataset.course, input.value])));
    data.links = Array.from({length: 5}, (_, i) => ({label: data[`linkLabel${i}`], url: data[`linkUrl${i}`]}));
    data.links.forEach((_, i) => { delete data[`linkLabel${i}`]; delete data[`linkUrl${i}`]; });
    return data;
}
function introductionMarkup(data) {
    const e = escapeCode;
    const name = [data.firstName, data.middleName, data.nickname ? `“${data.nickname}”` : "", data.lastName].filter(Boolean).join(" ");
    return `<p>${e(data.acknowledgment)} ${e(data.divider)} ${e(data.signature)} ${e(data.date)}</p>
<h6 class="display-name">${e(name)} ${e(data.divider)} ${e(data.adjective)} ${e(data.animal)}</h6>
<figure>
    <img src="${e(safeUrl(data.picture))}" alt="${e(data.pictureAlt)}" width="350" height="300">
    <figcaption>${e(data.caption)}</figcaption>
</figure>
<p>${e(data.statement)}</p>
<ul>
${bulletLabels.map((label, i) => `    <li><strong>${e(label)}:</strong> ${e(data[`bullet${i}`])}</li>`).join("\n")}
    <li><strong>Courses I'm Taking, &amp; Why:</strong>
        <ol>
${data.courses.map((course) => {
        const title = `${e(course.department)}${e(course.number)} - ${e(course.name)}`;
        return `            <li>${course.department.toUpperCase() === "ITIS" && course.number === "3135" ? `<a href="contract.html">${title}</a>` : title}: ${e(course.reason)}</li>`;
    }).join("\n")}
        </ol>
    </li>
</ul>
<blockquote>"${e(data.quote)}"<br>~ ${e(data.author)}</blockquote>${data.funny ? `\n<p>${e(data.funny)}</p>` : ""}${data.share ? `\n<p>${e(data.share)}</p>` : ""}`;
}
function footerMarkup(data) {
    // Retain the shared footer and replace only the five editable profile links.
    const footer = document.querySelector("footer").cloneNode(true);
    const originals = ["GitHub", "GitHub.io", "freeCodeCamp", "Codecademy", "LinkedIn"];
    data.links.forEach((link, i) => {
        const anchor = [...footer.querySelectorAll("a")].find((item) => item.textContent.trim() === originals[i]);
        if (anchor) { anchor.textContent = link.label; anchor.setAttribute("href", safeUrl(link.url)); }
    });
    return footer.outerHTML;
}
function xmlNode(key, value, indent = "") {
    if (Array.isArray(value)) return `${indent}<${key}>\n${value.map((item) => xmlNode("item", item, indent + "  ")).join("\n")}\n${indent}</${key}>`;
    if (value !== null && typeof value === "object") return `${indent}<${key}>\n${Object.entries(value).map(([name, item]) => xmlNode(name, item, indent + "  ")).join("\n")}\n${indent}</${key}>`;
    return `${indent}<${key}>${escapeCode(value)}</${key}>`;
}
form.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-format]");
    if (!button) return;
    const data = await collectData();
    const format = button.dataset.format;
    let code;
    if (format === "json") code = JSON.stringify(data, null, 2);
    if (format === "xml") code = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlNode("introduction", data);
    if (format === "html") code = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeCode(data.firstName)} ${escapeCode(data.lastName)} | ITIS3135 | Introduction Form</title>
    <link rel="stylesheet" href="styles/default.css">
</head>
<body>
${document.querySelector("header") ? document.querySelector("header").outerHTML : ""}
<main>
<h2>Introduction Form</h2>
${introductionMarkup(data)}
</main>
${footerMarkup(data)}
</body>
</html>`;
    let textarea = document.getElementById(`output-${format}`);
    if (!textarea) {
        const label = document.createElement("label");
        label.htmlFor = `output-${format}`;
        label.textContent = `Generated ${format.toUpperCase()}`;
        textarea = document.createElement("textarea");
        textarea.id = label.htmlFor;
        textarea.rows = 18;
        textarea.readOnly = true;
        output.append(label, textarea);
    }
    textarea.value = code;
    output.hidden = false;
});
document.getElementById("add-course").addEventListener("click", () => {
    const row = document.createElement("fieldset");
    row.className = "course";
    row.innerHTML = '<legend>Course</legend>' + ["department", "number", "name", "reason"].map((key) => `<label>${key}<input data-course="${key}" placeholder="Course ${key}" required></label>`).join("") + '<button type="button" class="delete-course">Delete course</button>';
    courses.append(row);
});
courses.addEventListener("click", (event) => {
    if (event.target.matches(".delete-course")) event.target.closest(".course").remove();
});
form.addEventListener("reset", () => {
    courses.innerHTML = initialCourses;
    imageRead = Promise.resolve(null);
    output.querySelectorAll("label, textarea").forEach((element) => element.remove());
    output.hidden = true;
});
document.getElementById("clear").addEventListener("click", () => {
    form.querySelectorAll("input").forEach((input) => { input.value = ""; });
    imageRead = Promise.resolve(null);
    output.querySelectorAll("label, textarea").forEach((element) => element.remove());
    output.hidden = true;
});
let originalFooter;
form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = await collectData();
    const footer = document.querySelector("footer");
    originalFooter = footer.outerHTML;
    const newFooter = footerMarkup(data);
    result.innerHTML = introductionMarkup(data) + '\n<p><a href="#introduction-form" id="start-again">Reset introduction form</a></p>';
    footer.outerHTML = newFooter;
    form.hidden = true;
    form.previousElementSibling.hidden = true;
    result.hidden = false;
    output.hidden = true;
    document.getElementById("start-again").addEventListener("click", () => {
        document.querySelector("footer").outerHTML = originalFooter;
        form.reset();
        form.hidden = false;
        form.previousElementSibling.hidden = false;
        result.hidden = true;
        output.hidden = true;
    });
});
