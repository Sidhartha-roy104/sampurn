const Notes = (() => {

  let _userId = null;
  let _searchMode = false;

  function init(userId){

    _userId = userId;

    _bind();

    _loadToday();

  }

  function _bind(){

    const notesOpen =
      document.getElementById("notes-open");

    const notesOverlay =
      document.getElementById("notes-overlay");

    const notesClose =
      document.getElementById("notes-close");

    const notesSearchBtn =
      document.getElementById("notes-search-btn");

    const notesSearchInput =
      document.getElementById("notes-search-input");

    notesOpen.addEventListener("click", () => {

      notesOverlay.classList.add("show");

      _exitSearchMode();

    });

    notesClose.addEventListener("click", () => {

      notesOverlay.classList.remove("show");

    });

    notesOverlay.addEventListener("click", (e) => {

      if(e.target === notesOverlay){

        notesOverlay.classList.remove("show");

      }

    });

    notesSearchBtn.addEventListener("click", () => {

      _toggleSearchMode();

    });

    notesSearchInput.addEventListener("input", (e) => {

      _search(e.target.value);

    });

    /* AUTO SAVE */

    document
      .getElementById("notes-input")
      .addEventListener("input", _autoSave);

  }

  function _todayKey(){

    return `notes_${_userId}_${Utils.todayStr()}`;

  }

  /* AUTO SAVE */

  function _autoSave(){

    const val =
      document.getElementById("notes-input").value;

    const note = {

      text: val,

      time: new Date().toISOString()

    };

    localStorage.setItem(
      _todayKey(),
      JSON.stringify(note)
    );

  }

  /* LOAD TODAY */

  function _loadToday(){

    const raw =
      localStorage.getItem(_todayKey());

    if(!raw) return;

    const note = JSON.parse(raw);

    document
      .getElementById("notes-input")
      .value = note.text || "";

  }

  /* SEARCH TOGGLE */

  function _toggleSearchMode(){

    _searchMode = !_searchMode;

    const searchWrap =
      document.getElementById("notes-search-input-wrap");

    const editorWrap =
      document.getElementById("notes-editor-wrap");

    const resultsWrap =
      document.getElementById("notes-results-wrap");

    if(_searchMode){

      searchWrap.classList.remove("hidden");

      editorWrap.classList.add("hidden");

      resultsWrap.classList.add("hidden");

      document
        .getElementById("notes-search-input")
        .focus();

    } else {

      _exitSearchMode();

    }

  }

  function _exitSearchMode(){

    _searchMode = false;

    const searchWrap =
      document.getElementById("notes-search-input-wrap");

    const editorWrap =
      document.getElementById("notes-editor-wrap");

    const resultsWrap =
      document.getElementById("notes-results-wrap");

    searchWrap.classList.add("hidden");

    editorWrap.classList.remove("hidden");

    resultsWrap.classList.add("hidden");

    document
      .getElementById("notes-search-input")
      .value = "";

  }

  /* SEARCH */

  function _search(query){

    if(!query.trim()){

      document
        .getElementById("notes-results-wrap")
        .classList.add("hidden");

      return;

    }

    const q = query.toLowerCase();

    const results = [];

    for(let i = 0; i < localStorage.length; i++){

      const key = localStorage.key(i);

      if(key.startsWith(`notes_${_userId}_`)){

        try {

          const note = JSON.parse(localStorage.getItem(key));

          if(note.text && note.text.toLowerCase().includes(q)){

            const dateStr = key.split("_")[2];

            results.push({

              dateStr,

              text: note.text,

              time: note.time

            });

          }

        } catch(e) {

          console.error("Error parsing note:", e);

        }

      }

    }

    results.sort((a, b) => new Date(b.time) - new Date(a.time));

    _displayResults(results);

  }

  function _displayResults(results){

    const resultsWrap =
      document.getElementById("notes-results-wrap");

    const resultsContainer =
      document.getElementById("notes-results");

    if(results.length === 0){

      resultsContainer.innerHTML =
        '<div style="color:#8f8a82;text-align:center;padding:20px">No notes found</div>';

      resultsWrap.classList.remove("hidden");

      return;

    }

    resultsContainer.innerHTML = results.map((result, idx) => `

      <div class="notes-result-item" data-idx="${idx}">

        <div class="notes-result-date">${_formatDate(result.dateStr)}</div>

        <div class="notes-result-text">${Utils.escHtml(result.text)}</div>

      </div>

    `).join("");

    resultsWrap.classList.remove("hidden");

    document.querySelectorAll(".notes-result-item").forEach((item, idx) => {

      item.addEventListener("click", () => _loadOldNote(results[idx]));

    });

  }

  function _formatDate(dateStr){

    if(!dateStr) return "Unknown";

    const year = parseInt(dateStr.slice(0, 4));

    const month = parseInt(dateStr.slice(4, 6));

    const day = parseInt(dateStr.slice(6, 8));

    const d = new Date(year, month - 1, day);

    return d.toLocaleDateString("en-US", {

      month: "short",

      day: "numeric",

      year: year !== new Date().getFullYear() ? "numeric" : undefined

    });

  }

  function _loadOldNote(noteData){

    _exitSearchMode();

    document
      .getElementById("notes-input")
      .value = noteData.text;

  }

  function newDay(date){

    _exitSearchMode();

    _loadToday();

  }

  return { init, newDay };

})();