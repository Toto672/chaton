import { Check, ChevronDown, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/features/workspace/store";

export function MainView() {
  const { state, startConversationDraft } = useWorkspace();
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement | null>(null);
  const selectedConversation = state.conversations.find(
    (conversation) => conversation.id === state.selectedConversationId,
  );
  const selectedProject = state.projects.find(
    (project) => project.id === state.selectedProjectId,
  );
  const isDraftConversation =
    state.selectedProjectId !== null && !selectedConversation;

  useEffect(() => {
    if (!isProjectMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!projectMenuRef.current?.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProjectMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isProjectMenuOpen]);

  return (
    <div className="main-scroll">
      <section className="hero-section">
        <div className="hero-group">
          <div className="hero-icon-wrap">
            <Sparkles className="h-5 w-5 text-[#17181d]" />
          </div>
          <h1 className="hero-title">
            {selectedConversation?.title ?? "Let's create"}
          </h1>
          <div className="hero-subtitle-wrap" ref={projectMenuRef}>
            {isDraftConversation ? (
              <>
                <button
                  type="button"
                  className="hero-subtitle-button"
                  onClick={() => setIsProjectMenuOpen((current) => !current)}
                  aria-haspopup="menu"
                  aria-expanded={isProjectMenuOpen}
                >
                  <span>{selectedProject?.name ?? "Aucun projet sélectionné"}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isProjectMenuOpen ? (
                  <div className="hero-project-menu" role="menu">
                    {state.projects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={project.id === state.selectedProjectId}
                        className={`hero-project-menu-item ${
                          project.id === state.selectedProjectId
                            ? "hero-project-menu-item-active"
                            : ""
                        }`}
                        onClick={() => {
                          startConversationDraft(project.id);
                          setIsProjectMenuOpen(false);
                        }}
                      >
                        <span>{project.name}</span>
                        {project.id === state.selectedProjectId ? (
                          <Check className="h-4 w-4" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="hero-subtitle">
                {selectedProject?.name ?? "Aucun projet sélectionné"}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
