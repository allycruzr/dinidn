// Loads the Belvo Connect Widget SDK lazily and opens it.
//
// The SDK is loaded from Belvo's CDN. It exposes a global `belvoSDK` object
// with a `createWidget(access, { callback, onExit, onEvent, ... })` factory.
//
// Reference: https://developers.belvo.com/docs/connect-widget-overview

const BELVO_WIDGET_SRC = "https://cdn.belvo.io/belvo-widget-1-stable.js";

declare global {
  interface Window {
    belvoSDK?: {
      // deno-lint-ignore no-explicit-any
      createWidget: (access: string, options: any) => { build: () => void };
    };
  }
}

let loadPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.belvoSDK) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${BELVO_WIDGET_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Belvo widget script")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = BELVO_WIDGET_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Belvo widget script"));
    document.body.appendChild(script);
  });

  return loadPromise;
}

export interface OpenBelvoWidgetOptions {
  accessToken: string;
  onSuccess: (linkId: string, institution: string) => void;
  onExit?: () => void;
  onError?: (error: unknown) => void;
  country?: "BR" | "MX" | "CO";
}

export async function openBelvoWidget(options: OpenBelvoWidgetOptions): Promise<void> {
  await loadScript();

  if (!window.belvoSDK) {
    throw new Error("belvoSDK not available after script load");
  }

  // The Belvo widget requires <div id="belvo"></div> to exist in the DOM.
  // Create it if missing; clear it if already there (so re-opens start fresh).
  let container = document.getElementById("belvo");
  if (!container) {
    container = document.createElement("div");
    container.id = "belvo";
    document.body.appendChild(container);
  } else {
    container.innerHTML = "";
  }

  const widget = window.belvoSDK.createWidget(options.accessToken, {
    locale: "pt",
    country_codes: [options.country ?? "BR"],
    callback: (link: string, institution: string) => {
      options.onSuccess(link, institution);
    },
    onExit: () => {
      options.onExit?.();
    },
    // deno-lint-ignore no-explicit-any
    onEvent: (event: any) => {
      if (event?.name === "ERROR" || event?.type === "error") {
        options.onError?.(event);
      }
    },
  });

  widget.build();
}
