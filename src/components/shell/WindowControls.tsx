import { useEffect, useState } from "react";

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial maximized state
    window.electron?.ipcRenderer.invoke("window:isMaximized").then(setIsMaximized);

    // Listen for maximize/unmaximize events
    const handleMaximize = () => setIsMaximized(true);
    const handleUnmaximize = () => setIsMaximized(false);

    window.electron?.ipcRenderer.on("window:maximized", handleMaximize);
    window.electron?.ipcRenderer.on("window:unmaximized", handleUnmaximize);

    return () => {
      window.electron?.ipcRenderer.off("window:maximized", handleMaximize);
      window.electron?.ipcRenderer.off("window:unmaximized", handleUnmaximize);
    };
  }, []);

  const handleClose = () => {
    window.electron?.ipcRenderer.send("window:close");
  };

  const handleMinimize = () => {
    window.electron?.ipcRenderer.send("window:minimize");
  };

  const handleMaximize = () => {
    window.electron?.ipcRenderer.send("window:maximize");
  };

  return (
    <div className="window-controls">
      <button
        className="window-control window-control-close"
        onClick={handleClose}
        aria-label="Close"
      >
        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      <button
        className="window-control window-control-minimize"
        onClick={handleMinimize}
        aria-label="Minimize"
      >
        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      <button
        className="window-control window-control-maximize"
        onClick={handleMaximize}
        aria-label={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M4 4V3C4 2.44772 4.44772 2 5 2H9C9.55228 2 10 2.44772 10 3V7C10 7.55228 9.55228 8 9 8H8" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ) : (
          <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        )}
      </button>
    </div>
  );
}
