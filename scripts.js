const $ = (id) => document.getElementById(id);
const taskForm = $("taskForm"), taskInput = $("taskInput"), saveBtn = $("saveBtn");
const taskList = $("taskList"), taskCount = $("taskCount"), jsonOutput = $("jsonOutput");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let draggedIdx = null;

// 1. Pusat sinkronisasi: urutkan ID, simpan ke storage, dan render ulang
const sync = () => {
    tasks.forEach((t, i) => t.id = i + 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    render();
};

// 2. Format tanggal otomatis dengan pemisah titik dua (:)
const formatNow = () => new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
});

// 3. Render daftar catatan
const render = () => {
    taskCount.textContent = tasks.length;

    if (!tasks.length) {
        taskList.innerHTML = `<li class="list-group-item text-center text-muted py-4">Belum ada catatan tersimpan.</li>`;
        return;
    }

    taskList.innerHTML = tasks.map((item, idx) => `
      <li class="list-group-item d-flex justify-content-between align-items-center py-3 task-item" draggable="true" data-index="${idx}" style="cursor: grab;">
        <div class="d-flex align-items-center flex-grow-1 me-3">
          <span class="text-muted me-3 user-select-none">☰</span>
          <input class="form-check-input check theme-inverse check-lg mt-0 me-3 flex-shrink-0" type="checkbox" data-action="toggle" ${item.complete ? "checked" : ""} style="cursor: pointer;">
          <div class="w-100">
            <span class="badge bg-light text-dark border me-1">#${item.id}</span>
            <span data-action="edit" class="${item.complete ? "text-decoration-line-through text-muted" : "fw-medium"}" style="cursor: text;"></span>
            <small class="d-block text-muted mt-1" style="font-size: 0.75rem;">Ditambahkan: ${item.dateAdded}</small>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger flex-shrink-0" data-action="delete">Hapus</button>
      </li>
    `).join("");

    // Isi teks catatan via textContent agar aman dari XSS tanpa fungsi escapeHTML terpisah
    taskList.querySelectorAll('[data-action="edit"]').forEach((el, i) => el.textContent = tasks[i].task);
};

// 4. Input & Submit Form
taskInput.addEventListener("input", () => saveBtn.disabled = !taskInput.value.trim());

taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    tasks.push({ id: tasks.length + 1, task: text, complete: false, dateAdded: formatNow() });
    taskInput.value = "";
    saveBtn.disabled = true;
    sync();
});

// 5. Event Delegation: Klik Hapus & Edit Teks
taskList.addEventListener("click", (e) => {
    const li = e.target.closest(".task-item");
    if (!li) return;
    const idx = Number(li.dataset.index);
    const action = e.target.dataset.action;

    if (action === "delete") {
        tasks.splice(idx, 1);
        sync();
    } else if (action === "edit") {
        const span = e.target;
        const input = Object.assign(document.createElement("input"), {
            type: "text",
            className: "form-control form-control-sm d-inline-block w-75",
            value: tasks[idx].task
        });

        span.replaceWith(input);
        input.focus();

        const commit = () => {
            if (input.value.trim()) tasks[idx].task = input.value.trim(); tasks[idx].dateAdded = formatNow();
            sync();
        };

        input.addEventListener("blur", commit);
        input.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") { ev.preventDefault(); input.blur(); }
            if (ev.key === "Escape") render();
        });
    }
});

// 6. Event Delegation: Checkbox Complete
taskList.addEventListener("change", (e) => {
    if (e.target.dataset.action === "toggle") {
        const idx = Number(e.target.closest(".task-item").dataset.index);
        tasks[idx].complete = e.target.checked;
        tasks[idx].dateAdded = formatNow();
        sync();
    }
});

// 7. Event Delegation: Drag & Drop
taskList.addEventListener("dragstart", (e) => {
    const li = e.target.closest(".task-item");
    if (!li) return;
    draggedIdx = Number(li.dataset.index);
    li.style.opacity = "0.5";
});

taskList.addEventListener("dragend", (e) => {
    const li = e.target.closest(".task-item");
    if (li) li.style.opacity = "1";
    taskList.querySelectorAll(".task-item").forEach(el => el.classList.remove("border-primary", "border-2"));
});

taskList.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.target.closest(".task-item")?.classList.add("border-primary", "border-2");
});

taskList.addEventListener("dragleave", (e) => {
    e.target.closest(".task-item")?.classList.remove("border-primary", "border-2");
});

taskList.addEventListener("drop", (e) => {
    e.preventDefault();
    const targetLi = e.target.closest(".task-item");
    if (!targetLi || draggedIdx === null) return;

    const targetIdx = Number(targetLi.dataset.index);
    if (draggedIdx !== targetIdx) {
        tasks.splice(targetIdx, 0, tasks.splice(draggedIdx, 1)[0]);
        sync();
    }
});

// 8. Export JSON
window.showJSON = () => jsonOutput.textContent = JSON.stringify(tasks, null, 2);

render();