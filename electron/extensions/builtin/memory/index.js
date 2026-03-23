export function mountMemoryApp(root) {
  var EXTENSION_ID = "@chaton/memory";
  var ui = window.chatonExtensionComponents;

  if (!ui) throw new Error("chatonExtensionComponents is required");
  ui.ensureStyles();

  // =========================================================================
  // i18n - Internationalization
  // =========================================================================

  var translations = {
    fr: {
      // App title
      appTitle: "Mémoire",

      // Fatal error messages
      fatalErrorTitle: "Impossible de charger la vue Mémoire",
      fatalErrorDefault: "Une erreur inconnue est survenue.",

      // Time relative labels
      timeNow: "À l'instant",
      timeMinute: " min",
      timeHour: " h",
      timeDay: " j",
      timeMonth: " mois",
      dateUnknown: "Date inconnue",

      // Kind labels
      kindPreference: "Préférence",
      kindFact: "Fait",
      kindProfile: "Profil",
      kindDecision: "Décision",
      kindContext: "Contexte",
      kindDefault: "Fait",

      // Scope labels
      scopeGlobal: "Globale",
      scopeProject: "Projet",

      // Buttons
      btnNew: "+ Nouveau",
      btnSearch: "Rechercher",
      btnArchive: "Archiver",
      btnUnarchive: "Désarchiver",
      btnDelete: "Supprimer",
      btnCancel: "Annuler",
      btnSave: "Enregistrer",

      // Search
      searchPlaceholder: "Rechercher dans la mémoire…",

      // Filters - Scope
      filterScopeAll: "Toutes",
      filterScopeGlobal: "Globales",
      filterScopeProject: "Projets",

      // Filters - Kind
      filterKindAll: "Tous les types",
      filterKindPreference: "Préférences",
      filterKindFact: "Faits",
      filterKindProfile: "Profils",
      filterKindDecision: "Décisions",
      filterKindContext: "Contexte",

      // Empty states
      emptySelectMemory: "Sélectionnez une mémoire",
      emptySelectDescription: "Choisissez une entrée dans la liste pour voir ses détails, ou créez une nouvelle mémoire.",
      emptyNoMemory: "Aucune mémoire trouvée.",

      // Entry list
      entrySuffix: "entrée",
      entriesSuffix: "entrées",
      untitled: "Sans titre",

      // Modal - Create
      modalCreateTitle: "Ajouter une mémoire",
      modalCreateDescription: "Enregistrez une préférence, un fait, une décision ou tout autre contexte que Chatons devra retenir.",
      labelScope: "Portée",
      labelProject: "Projet",
      labelKind: "Type",
      labelTitle: "Titre",
      labelTags: "Tags",
      labelContent: "Contenu",
      placeholderTitle: "Titre court et descriptif",
      placeholderTags: "style, utilisateur, workflow",
      placeholderContent: "L'utilisateur préfère des réponses concises avec des exemples de code.",
      helpProjectRequired: "Requis pour un scope projet.",
      helpTagsSeparator: "Séparez les tags par des virgules.",

      // Modal - Scope options
      scopeGlobalOption: "Globale",
      scopeProjectOption: "Projet",

      // Modal - Kind options
      kindFactOption: "Fait",
      kindPreferenceOption: "Préférence",
      kindProfileOption: "Profil",
      kindDecisionOption: "Décision",
      kindContextOption: "Contexte",

      // Detail panel
      detailUpdated: "mis à jour",
      badgeArchived: "Archivée",

      // Detail sections
      sectionContent: "Contenu",
      sectionTags: "Tags",
      sectionMetadata: "Métadonnées",

      // Metadata labels
      metaId: "ID",
      metaScope: "Portée",
      metaType: "Type",
      metaProject: "Projet",
      metaSource: "Source",
      metaSourceManual: "Manuelle",
      metaCreated: "Créée le",
      metaUpdated: "Mis à jour",
      metaLastAccess: "Dernier accès",
      metaAccessCount: "Nombre d'accès",

      // Projects dropdown
      projectNone: "Aucun",
      projectDefault: "Projet",

      // Error messages
      errorLoadProjects: "Impossible de charger la liste des projets.",
      errorLoadEntries: "Impossible de charger les entrées mémoire.",
    },

    en: {
      // App title
      appTitle: "Memory",

      // Fatal error messages
      fatalErrorTitle: "Unable to load Memory view",
      fatalErrorDefault: "An unknown error occurred.",

      // Time relative labels
      timeNow: "Just now",
      timeMinute: " min",
      timeHour: " h",
      timeDay: " d",
      timeMonth: " mo",
      dateUnknown: "Unknown date",

      // Kind labels
      kindPreference: "Preference",
      kindFact: "Fact",
      kindProfile: "Profile",
      kindDecision: "Decision",
      kindContext: "Context",
      kindDefault: "Fact",

      // Scope labels
      scopeGlobal: "Global",
      scopeProject: "Project",

      // Buttons
      btnNew: "+ New",
      btnSearch: "Search",
      btnArchive: "Archive",
      btnUnarchive: "Unarchive",
      btnDelete: "Delete",
      btnCancel: "Cancel",
      btnSave: "Save",

      // Search
      searchPlaceholder: "Search in memory…",

      // Filters - Scope
      filterScopeAll: "All",
      filterScopeGlobal: "Global",
      filterScopeProject: "Projects",

      // Filters - Kind
      filterKindAll: "All types",
      filterKindPreference: "Preferences",
      filterKindFact: "Facts",
      filterKindProfile: "Profiles",
      filterKindDecision: "Decisions",
      filterKindContext: "Context",

      // Empty states
      emptySelectMemory: "Select a memory",
      emptySelectDescription: "Choose an entry from the list to view its details, or create a new memory.",
      emptyNoMemory: "No memories found.",

      // Entry list
      entrySuffix: "entry",
      entriesSuffix: "entries",
      untitled: "Untitled",

      // Modal - Create
      modalCreateTitle: "Add a memory",
      modalCreateDescription: "Record a preference, fact, decision, or any other context that Chatons should remember.",
      labelScope: "Scope",
      labelProject: "Project",
      labelKind: "Type",
      labelTitle: "Title",
      labelTags: "Tags",
      labelContent: "Content",
      placeholderTitle: "Short descriptive title",
      placeholderTags: "style, user, workflow",
      placeholderContent: "The user prefers concise responses with code examples.",
      helpProjectRequired: "Required for project scope.",
      helpTagsSeparator: "Separate tags with commas.",

      // Modal - Scope options
      scopeGlobalOption: "Global",
      scopeProjectOption: "Project",

      // Modal - Kind options
      kindFactOption: "Fact",
      kindPreferenceOption: "Preference",
      kindProfileOption: "Profile",
      kindDecisionOption: "Decision",
      kindContextOption: "Context",

      // Detail panel
      detailUpdated: "updated",
      badgeArchived: "Archived",

      // Detail sections
      sectionContent: "Content",
      sectionTags: "Tags",
      sectionMetadata: "Metadata",

      // Metadata labels
      metaId: "ID",
      metaScope: "Scope",
      metaType: "Type",
      metaProject: "Project",
      metaSource: "Source",
      metaSourceManual: "Manual",
      metaCreated: "Created",
      metaUpdated: "Updated",
      metaLastAccess: "Last accessed",
      metaAccessCount: "Access count",

      // Projects dropdown
      projectNone: "None",
      projectDefault: "Project",

      // Error messages
      errorLoadProjects: "Unable to load project list.",
      errorLoadEntries: "Unable to load memory entries.",
    },
  };

  // Detect locale from browser, default to French
  var currentLocale = (function () {
    var lang = navigator.language || navigator.userLanguage || "fr";
    var base = lang.split("-")[0].toLowerCase();
    // Check if we have translations for this language
    if (translations[base]) {
      return base;
    }
    return "fr";
  })();

  function t(key) {
    var locale = translations[currentLocale];
    if (locale && locale[key] !== undefined) {
      return locale[key];
    }
    // Fallback to French
    if (translations.fr[key] !== undefined) {
      return translations.fr[key];
    }
    // Return key as last resort
    return key;
  }

  // =========================================================================
  // End i18n
  // =========================================================================

  function createSvgIcon(pathDefs, size) {
    if (typeof ui.createSvgIcon === "function") {
      return ui.createSvgIcon(pathDefs, size);
    }

    var ns = "http://www.w3.org/2000/svg";
    var s = size || 20;
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", String(s));
    svg.setAttribute("height", String(s));
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.75");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("class", "ce-page-icon");
    pathDefs.forEach(function (d) {
      var path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
    return svg;
  }

  // Sync dark mode class from parent frame
  function syncThemeClass() {
    var root = document.documentElement;
    if (!root) return;
    root.classList.toggle(
      "dark",
      !!(
        window.parent &&
        window.parent.document &&
        window.parent.document.documentElement &&
        window.parent.document.documentElement.classList.contains("dark")
      ),
    );
  }

  syncThemeClass();
  if (window.matchMedia) {
    var media = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", syncThemeClass);
    } else if (typeof media.addListener === "function") {
      media.addListener(syncThemeClass);
    }
  }

  // Memory uses shared shell classes from components.js
  // No additional CSS needed - all styles are in components.js

  var app = root || document.getElementById("app");
  if (!app) {
    throw new Error("memory root #app not found");
  }

  function showFatalError(message) {
    document.body.innerHTML = "";
    var wrapper = ui.el("div", "ce-shell");
    wrapper.style.minHeight = "100vh";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.padding = "24px";

    var card = ui.el("div", "ce-shell-detail-card");
    card.style.display = "block";
    card.style.maxWidth = "720px";

    var title = ui.el("h2", "ce-shell-detail-title", t("fatalErrorTitle"));
    var body = ui.el(
      "p",
      "ce-shell-detail-meta",
      String(message || t("fatalErrorDefault")),
    );

    card.appendChild(title);
    card.appendChild(body);
    wrapper.appendChild(card);
    document.body.appendChild(wrapper);
  }

  var state = {
    entries: [],
    projects: [],
    selected: null,
    searchQuery: "",
    filterScope: "all",
    filterKind: "",
  };

  function call(api, payload) {
    return window.chaton.extensionCall(
      "chatons-ui",
      EXTENSION_ID,
      api,
      "^1.0.0",
      payload,
    );
  }

  function clearChildren(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function clamp(text, n) {
    var s = String(text || "");
    if (s.length <= n) return s;
    return s.slice(0, n - 1) + "\u2026";
  }

  function nowRel(iso) {
    var ts = Date.parse(iso);
    if (!Number.isFinite(ts)) return t("dateUnknown");
    var diff = Date.now() - ts;
    var minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t("timeNow");
    if (minutes < 60) return minutes + t("timeMinute");
    var hours = Math.floor(diff / 3600000);
    if (hours < 24) return hours + t("timeHour");
    var days = Math.floor(diff / 86400000);
    if (days < 30) return days + t("timeDay");
    return Math.floor(days / 30) + t("timeMonth");
  }

  function fmtDate(iso) {
    var ts = Date.parse(iso || "");
    if (!Number.isFinite(ts)) return t("dateUnknown");
    // Use current locale for date formatting
    var localeMap = { fr: "fr-FR", en: "en-US" };
    return new Date(ts).toLocaleString(localeMap[currentLocale] || "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function kindLabel(kind) {
    var map = {
      preference: t("kindPreference"),
      fact: t("kindFact"),
      profile: t("kindProfile"),
      decision: t("kindDecision"),
      context: t("kindContext"),
    };
    return map[kind] || kind || t("kindDefault");
  }

  function scopeLabel(scope) {
    return scope === "global" ? t("scopeGlobal") : t("scopeProject");
  }

  // Build the shell layout
  function buildShell() {
    clearChildren(app);

    var page = ui.el("div", "ce-shell");
    var layout = ui.el("div", "ce-shell-layout");

    // --- LEFT: Inbox / list pane ---
    var inbox = ui.el("section", "ce-shell-inbox");

    // Fixed header container (title, search, filters) - not scrollable
    var headerWrap = ui.el("div", "ce-shell-header-wrap");

    // Header
    var inboxHeader = ui.el("div", "ce-shell-inbox-header");
    var titleWrap = ui.el("div", "ce-shell-title-wrap");
    var brainIcon = createSvgIcon([
      "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",
      "M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",
      "M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4",
      "M17.599 6.5a3 3 0 0 0 .399-1.375",
      "M6.003 5.125A3 3 0 0 0 6.401 6.5",
      "M3.477 10.896a4 4 0 0 1 .585-.396",
      "M19.938 10.5a4 4 0 0 1 .585.396",
      "M6 18a4 4 0 0 1-1.967-.516",
      "M19.967 17.484A4 4 0 0 1 18 18",
    ], 24);
    titleWrap.appendChild(brainIcon);
    titleWrap.appendChild(ui.el("h1", "ce-shell-title", t("appTitle")));
    inboxHeader.appendChild(titleWrap);

    var newBtn = ui.createButton({ text: t("btnNew"), variant: "ghost" });
    newBtn.id = "newBtn";
    newBtn.classList.add("ce-shell-new-btn");
    inboxHeader.appendChild(newBtn);
    headerWrap.appendChild(inboxHeader);

    // Search bar
    var searchWrap = ui.el("div", "ce-shell-search-wrap");
    var searchRow = ui.el("div", "ce-shell-search");
    var searchInput = ui.el("input", "ce-shell-search-input");
    searchInput.id = "searchInput";
    searchInput.type = "text";
    searchInput.placeholder = t("searchPlaceholder");
    searchRow.appendChild(searchInput);
    var searchBtn = ui.createButton({ text: t("btnSearch"), variant: "outline" });
    searchBtn.id = "searchBtn";
    searchRow.appendChild(searchBtn);
    searchWrap.appendChild(searchRow);
    headerWrap.appendChild(searchWrap);

    // Filters
    var filters = ui.el("div", "ce-shell-filters");

    var scopeSelect = ui.el("select", "ce-shell-filter-select");
    scopeSelect.id = "scopeFilter";
    [
      ["all", t("filterScopeAll")],
      ["global", t("filterScopeGlobal")],
      ["project", t("filterScopeProject")],
    ].forEach(function (entry) {
      var opt = ui.el("option", "", entry[1]);
      opt.value = entry[0];
      scopeSelect.appendChild(opt);
    });
    filters.appendChild(scopeSelect);

    var kindSelect = ui.el("select", "ce-shell-filter-select");
    kindSelect.id = "kindFilter";
    [
      ["", t("filterKindAll")],
      ["preference", t("filterKindPreference")],
      ["fact", t("filterKindFact")],
      ["profile", t("filterKindProfile")],
      ["decision", t("filterKindDecision")],
      ["context", t("filterKindContext")],
    ].forEach(function (entry) {
      var opt = ui.el("option", "", entry[1]);
      opt.value = entry[0];
      kindSelect.appendChild(opt);
    });
    filters.appendChild(kindSelect);

    var countLabel = ui.el("span", "ce-shell-count");
    countLabel.id = "entryCount";
    filters.appendChild(countLabel);

    headerWrap.appendChild(filters);
    inbox.appendChild(headerWrap);

    // Memory list (scrollable)
    var listSection = ui.el("section", "ce-shell-section");
    var memList = ui.el("div", "ce-shell-list");
    memList.id = "memList";
    listSection.appendChild(memList);
    inbox.appendChild(listSection);

    // --- RIGHT: Detail pane ---
    var detail = ui.el("section", "ce-shell-detail");

    // Empty state
    var detailEmpty = ui.el("div", "ce-shell-empty");
    detailEmpty.id = "detailEmpty";
    var emptyIcon = createSvgIcon([
      "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",
      "M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",
      "M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4",
    ], 42);
    emptyIcon.classList.add("ce-shell-empty-icon");
    detailEmpty.appendChild(emptyIcon);
    detailEmpty.appendChild(
      ui.el("p", "ce-shell-empty-title", t("emptySelectMemory")),
    );
    detailEmpty.appendChild(
      ui.el(
        "p",
        "ce-shell-empty-copy",
        t("emptySelectDescription"),
      ),
    );

    // Detail card
    var detailCard = ui.el("article", "ce-shell-detail-card");
    detailCard.id = "detailCard";

    var detailHeader = ui.el("div", "ce-shell-detail-header");
    var detailTitleWrap = ui.el("div", "");
    var detailTitle = ui.el("h3", "ce-shell-detail-title", "");
    detailTitle.id = "detailTitle";
    var detailMeta = ui.el("p", "ce-shell-detail-meta", "");
    detailMeta.id = "detailMeta";
    detailTitleWrap.appendChild(detailTitle);
    detailTitleWrap.appendChild(detailMeta);

    var detailActions = ui.el("div", "ce-shell-detail-actions");
    var archiveBtn = ui.createButton({ text: t("btnArchive"), variant: "outline" });
    archiveBtn.id = "archiveBtn";
    var deleteBtn = ui.createButton({
      text: t("btnDelete"),
      variant: "ghost",
      className: "ce-shell-danger-btn",
    });
    deleteBtn.id = "deleteBtn";
    detailActions.appendChild(archiveBtn);
    detailActions.appendChild(deleteBtn);

    detailHeader.appendChild(detailTitleWrap);
    detailHeader.appendChild(detailActions);
    detailCard.appendChild(detailHeader);

    var detailBody = ui.el("div", "ce-shell-detail-body");
    detailBody.id = "detailBody";
    detailCard.appendChild(detailBody);

    detail.appendChild(detailEmpty);
    detail.appendChild(detailCard);

    layout.appendChild(inbox);
    layout.appendChild(detail);
    page.appendChild(layout);

    // --- CREATE MODAL ---
    var modalBg = ui.el("div", "ce-modal-backdrop");
    modalBg.id = "modalBg";
    modalBg.setAttribute("role", "dialog");
    modalBg.setAttribute("aria-modal", "true");
    modalBg.setAttribute("aria-labelledby", "modalTitle");

    var modal = ui.el("div", "ce-modal ce-modal--compact");
    var modalHeader = ui.el("div", "ce-modal__header");
    var modalTitle = ui.el("h3", "ce-modal__title", t("modalCreateTitle"));
    modalTitle.id = "modalTitle";
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(
      ui.el(
        "p",
        "ce-modal__description",
        t("modalCreateDescription"),
      ),
    );
    modal.appendChild(modalHeader);

    var primaryFields = ui.el("div", "ce-shell-modal-primary");
    var modalGrid = ui.el("div", "ce-shell-modal-grid");

    var createScope = ui.el("select", "ce-select");
    createScope.id = "createScope";
    [
      ["global", t("scopeGlobalOption")],
      ["project", t("scopeProjectOption")],
    ].forEach(function (entry) {
      var opt = ui.el("option", "", entry[1]);
      opt.value = entry[0];
      createScope.appendChild(opt);
    });
    modalGrid.appendChild(
      ui.createField({ label: t("labelScope"), input: createScope }),
    );

    var createProject = ui.el("select", "ce-select");
    createProject.id = "createProject";
    modalGrid.appendChild(
      ui.createField({
        label: t("labelProject"),
        input: createProject,
        help: t("helpProjectRequired"),
      }),
    );

    var createKind = ui.el("select", "ce-select");
    createKind.id = "createKind";
    [
      ["fact", t("kindFactOption")],
      ["preference", t("kindPreferenceOption")],
      ["profile", t("kindProfileOption")],
      ["decision", t("kindDecisionOption")],
      ["context", t("kindContextOption")],
    ].forEach(function (entry) {
      var opt = ui.el("option", "", entry[1]);
      opt.value = entry[0];
      createKind.appendChild(opt);
    });
    modalGrid.appendChild(
      ui.createField({ label: t("labelKind"), input: createKind }),
    );

    var createTitle = ui.el("input", "ce-input");
    createTitle.id = "createTitle";
    createTitle.placeholder = t("placeholderTitle");
    modalGrid.appendChild(
      ui.createField({ label: t("labelTitle"), input: createTitle }),
    );

    primaryFields.appendChild(modalGrid);

    var createTags = ui.el("input", "ce-input");
    createTags.id = "createTags";
    createTags.placeholder = t("placeholderTags");
    primaryFields.appendChild(
      ui.createField({
        label: t("labelTags"),
        input: createTags,
        help: t("helpTagsSeparator"),
      }),
    );

    var createContent = ui.el("textarea", "ce-textarea ce-textarea--short");
    createContent.id = "createContent";
    createContent.placeholder = t("placeholderContent");
    primaryFields.appendChild(
      ui.createField({ label: t("labelContent"), input: createContent }),
    );

    modal.appendChild(primaryFields);

    var modalFooter = ui.el("div", "ce-shell-modal-footer");
    var cancelBtn = ui.createButton({ text: t("btnCancel"), variant: "ghost" });
    cancelBtn.id = "cancelBtn";
    var createBtn = ui.createButton({ text: t("btnSave"), variant: "default" });
    createBtn.id = "createBtn";
    modalFooter.appendChild(cancelBtn);
    modalFooter.appendChild(createBtn);
    modal.appendChild(modalFooter);

    modalBg.appendChild(modal);

    app.appendChild(page);
    app.appendChild(modalBg);

    return {
      searchInput: searchInput,
      searchBtn: searchBtn,
      scopeFilter: scopeSelect,
      kindFilter: kindSelect,
      entryCount: countLabel,
      memList: memList,
      detailEmpty: detailEmpty,
      detailCard: detailCard,
      detailTitle: detailTitle,
      detailMeta: detailMeta,
      detailBody: detailBody,
      detailActions: detailActions,
      archiveBtn: archiveBtn,
      deleteBtn: deleteBtn,
      newBtn: newBtn,
      modalBg: modalBg,
      createScope: createScope,
      createProject: createProject,
      createKind: createKind,
      createTitle: createTitle,
      createTags: createTags,
      createContent: createContent,
      cancelBtn: cancelBtn,
      createBtn: createBtn,
    };
  }

  var refs;
  try {
    refs = buildShell();
  } catch (error) {
    console.error("[memory] failed to build shell", error);
    showFatalError(error && error.message ? error.message : String(error));
    return;
  }

  // --- Render functions ---

  function renderRow(entry) {
    var key = entry.id;
    var isActive = state.selected === key;
    var row = ui.el(
      "button",
      isActive ? "ce-shell-row ce-shell-row--active" : "ce-shell-row",
    );
    row.type = "button";

    var top = ui.el("div", "ce-shell-row-top");
    var badges = ui.el("div", "ce-shell-row-badges");
    badges.appendChild(
      ui.createBadge({
        text: scopeLabel(entry.scope),
        variant: entry.scope === "global" ? "default" : "secondary",
      }),
    );
    badges.appendChild(
      ui.createBadge({ text: kindLabel(entry.kind), variant: "outline" }),
    );
    top.appendChild(badges);
    top.appendChild(ui.el("span", "ce-shell-row-time", nowRel(entry.updatedAt)));
    row.appendChild(top);

    var main = ui.el("div", "ce-shell-row-main");
    main.appendChild(
      ui.el("span", "ce-shell-row-title", entry.title || t("untitled")),
    );
    main.appendChild(
      ui.el("p", "ce-shell-row-meta", clamp(entry.content || "", 100)),
    );
    row.appendChild(main);

    row.addEventListener("click", function () {
      state.selected = key;
      renderList();
      renderDetail();
    });

    return row;
  }

  function renderList() {
    clearChildren(refs.memList);

    if (!state.entries || !state.entries.length) {
      refs.memList.appendChild(
        ui.el("div", "ce-shell-subempty", t("emptyNoMemory")),
      );
      refs.entryCount.textContent = "";
      return;
    }

    var count = state.entries.length;
    var suffix = count > 1 ? t("entriesSuffix") : t("entrySuffix");
    refs.entryCount.textContent = count + " " + suffix;

    state.entries.forEach(function (entry) {
      refs.memList.appendChild(renderRow(entry));
    });
  }

  function appendKv(parent, label, value, mono) {
    var row = ui.el("div", "ce-shell-kv");
    row.appendChild(ui.el("span", "ce-shell-k", label));
    var val = ui.el(
      "span",
      mono ? "ce-shell-v ce-shell-v--mono" : "ce-shell-v",
      value || "-",
    );
    row.appendChild(val);
    parent.appendChild(row);
  }

  function renderDetail() {
    if (!state.selected) {
      refs.detailEmpty.style.display = "flex";
      refs.detailCard.style.display = "none";
      return;
    }

    var entry = state.entries.find(function (e) {
      return e.id === state.selected;
    });

    if (!entry) {
      state.selected = null;
      refs.detailEmpty.style.display = "flex";
      refs.detailCard.style.display = "none";
      return;
    }

    refs.detailEmpty.style.display = "none";
    refs.detailCard.style.display = "flex";

    refs.detailTitle.textContent = entry.title || t("untitled");
    refs.detailMeta.textContent =
      scopeLabel(entry.scope) +
      " · " +
      kindLabel(entry.kind) +
      " · " +
      t("detailUpdated") +
      " " +
      nowRel(entry.updatedAt);

    // Update archive button text
    refs.archiveBtn.textContent = entry.archived ? t("btnUnarchive") : t("btnArchive");

    clearChildren(refs.detailBody);

    // Summary badges
    var summary = ui.el("div", "ce-shell-summary");
    summary.appendChild(
      ui.createBadge({
        text: scopeLabel(entry.scope),
        variant: entry.scope === "global" ? "default" : "secondary",
      }),
    );
    summary.appendChild(
      ui.createBadge({ text: kindLabel(entry.kind), variant: "outline" }),
    );
    if (entry.archived) {
      summary.appendChild(
        ui.createBadge({ text: t("badgeArchived"), variant: "secondary" }),
      );
    }
    if (entry.source) {
      summary.appendChild(
        ui.createBadge({ text: entry.source, variant: "secondary" }),
      );
    }
    refs.detailBody.appendChild(summary);

    // Content block
    var contentTitle = ui.el("p", "ce-shell-detail-section-title", t("sectionContent"));
    refs.detailBody.appendChild(contentTitle);
    var contentBlock = ui.el(
      "div",
      "ce-shell-content-block",
      entry.content || "",
    );
    refs.detailBody.appendChild(contentBlock);

    // Tags
    if (entry.tags && entry.tags.length > 0) {
      var tagsTitle = ui.el("p", "ce-shell-detail-section-title", t("sectionTags"));
      refs.detailBody.appendChild(tagsTitle);
      var tagsWrap = ui.el("div", "ce-shell-tags");
      entry.tags.forEach(function (tag) {
        tagsWrap.appendChild(
          ui.createBadge({ text: tag, variant: "secondary" }),
        );
      });
      refs.detailBody.appendChild(tagsWrap);
    }

    // Metadata grid
    var metaTitle = ui.el("p", "ce-shell-detail-section-title", t("sectionMetadata"));
    refs.detailBody.appendChild(metaTitle);

    var grid = ui.el("div", "ce-shell-kv-grid");
    appendKv(grid, t("metaId"), entry.id, true);
    appendKv(grid, t("metaScope"), scopeLabel(entry.scope), false);
    appendKv(grid, t("metaType"), kindLabel(entry.kind), false);
    if (entry.projectId) {
      var projectName = "";
      state.projects.forEach(function (p) {
        if (p.id === entry.projectId) projectName = p.name || p.repoName || "";
      });
      appendKv(grid, t("metaProject"), projectName || entry.projectId, false);
    }
    appendKv(grid, t("metaSource"), entry.source || t("metaSourceManual"), false);
    appendKv(grid, t("metaCreated"), fmtDate(entry.createdAt), false);
    appendKv(grid, t("metaUpdated"), fmtDate(entry.updatedAt), false);
    if (entry.lastAccessedAt) {
      appendKv(grid, t("metaLastAccess"), fmtDate(entry.lastAccessedAt), false);
    }
    if (typeof entry.accessCount === "number" && entry.accessCount > 0) {
      appendKv(grid, t("metaAccessCount"), String(entry.accessCount), false);
    }
    refs.detailBody.appendChild(grid);
  }

  // --- Data loading ---

  async function loadProjects() {
    var res = await window.chaton.extensionHostCall(
      EXTENSION_ID,
      "projects.list",
      {},
    );
    if (!res || !res.ok) {
      throw new Error(
        (res && res.error && res.error.message) ||
          t("errorLoadProjects"),
      );
    }
    state.projects = res.data || [];
    clearChildren(refs.createProject);
    var empty = ui.el("option", "", t("projectNone"));
    empty.value = "";
    refs.createProject.appendChild(empty);
    state.projects.forEach(function (project) {
      var opt = ui.el("option", "", project.name || project.repoName || t("projectDefault"));
      opt.value = project.id;
      refs.createProject.appendChild(opt);
    });
  }

  async function loadAll() {
    var payload = {
      scope: state.filterScope,
      limit: 200,
    };
    if (state.filterKind) payload.kind = state.filterKind;

    var res;
    if (state.searchQuery) {
      res = await call("memory.search", {
        query: state.searchQuery,
        scope: state.filterScope,
        limit: 100,
        kind: state.filterKind || undefined,
      });
    } else {
      res = await call("memory.list", payload);
    }

    if (!res || !res.ok) {
      throw new Error(
        (res && res.error && res.error.message) ||
          t("errorLoadEntries"),
      );
    }

    state.entries = res.data || [];

    // If selected entry no longer exists, deselect
    if (state.selected) {
      var found = state.entries.some(function (e) {
        return e.id === state.selected;
      });
      if (!found) state.selected = null;
    }

    renderList();
    renderDetail();
  }

  // --- Event handlers ---

  // Search (via button or Enter)
  function doSearch() {
    state.searchQuery = refs.searchInput.value.trim();
    void loadAll();
  }

  refs.searchBtn.addEventListener("click", doSearch);
  refs.searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      doSearch();
    }
  });

  // Clear search on empty input
  refs.searchInput.addEventListener("input", function () {
    if (!refs.searchInput.value.trim() && state.searchQuery) {
      state.searchQuery = "";
      void loadAll();
    }
  });

  // Filters
  refs.scopeFilter.addEventListener("change", function () {
    state.filterScope = refs.scopeFilter.value;
    void loadAll();
  });

  refs.kindFilter.addEventListener("change", function () {
    state.filterKind = refs.kindFilter.value;
    void loadAll();
  });

  // Archive / Delete from detail pane
  refs.archiveBtn.addEventListener("click", async function () {
    if (!state.selected) return;
    var entry = state.entries.find(function (e) {
      return e.id === state.selected;
    });
    if (!entry) return;
    await call("memory.update", {
      id: entry.id,
      archived: !entry.archived,
    });
    void loadAll();
  });

  refs.deleteBtn.addEventListener("click", async function () {
    if (!state.selected) return;
    await call("memory.delete", { id: state.selected });
    state.selected = null;
    void loadAll();
  });

  // Create modal
  function openModal() {
    refs.modalBg.classList.add("is-open");
    refs.createTitle.focus();
  }

  function closeModal() {
    refs.modalBg.classList.remove("is-open");
  }

  refs.newBtn.addEventListener("click", openModal);
  refs.cancelBtn.addEventListener("click", closeModal);

  refs.modalBg.addEventListener("click", function (event) {
    if (event.target === refs.modalBg) closeModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && refs.modalBg.classList.contains("is-open")) {
      closeModal();
    }
  });

  refs.createBtn.addEventListener("click", async function () {
    var content = refs.createContent.value.trim();
    if (!content) {
      refs.createContent.focus();
      return;
    }

    var scope = refs.createScope.value;
    var projectId = refs.createProject.value || undefined;

    if (scope === "project" && !projectId) {
      refs.createProject.focus();
      return;
    }

    await call("memory.upsert", {
      scope: scope,
      projectId: projectId,
      kind: refs.createKind.value || "fact",
      title: refs.createTitle.value.trim() || undefined,
      content: content,
      tags: refs.createTags.value
        .split(",")
        .map(function (v) {
          return v.trim();
        })
        .filter(Boolean),
      source: "memory-ui",
    });

    // Reset form
    refs.createContent.value = "";
    refs.createTitle.value = "";
    refs.createTags.value = "";
    refs.createKind.value = "fact";
    refs.createScope.value = "global";
    refs.createProject.value = "";

    closeModal();
    void loadAll();
  });

  // Initial load
  loadProjects().then(loadAll).catch(function (error) {
    console.error("[memory] initial load failed", error);
    showFatalError(error && error.message ? error.message : String(error));
  });
}

if (typeof window !== "undefined") {
  var autoRoot = document.getElementById("app");
  if (autoRoot) {
    mountMemoryApp(autoRoot);
  }
}
