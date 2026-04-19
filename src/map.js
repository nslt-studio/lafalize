import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// ─── À modifier ───────────────────────────────────────────────────────────────
const MAPBOX_TOKEN = "pk.eyJ1IjoibnNsdC1zdHVkaW8iLCJhIjoiY21vNXRqd2lqMWt6azJ4cjA1aWh1Z25sYyJ9.lM5IBU3MKEG4BAWqZWNxjA";
const MAPBOX_STYLE = "mapbox://styles/nslt-studio/cmo5uh0fp000i01sec2g2b16g";
const MAPBOX_ZOOM  = 13;
// ──────────────────────────────────────────────────────────────────────────────

export function initMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  document.querySelectorAll(".adresses-item .pin-adresses").forEach((el, i) => { el.textContent = i + 1; });
  document.querySelectorAll(".pin-item .pin-button").forEach((el, i) => { el.textContent = i + 1; });

  const mapBtns = [...document.querySelectorAll(".map-button")];
  // Collect pin data + detach elements from DOM before Mapbox clears #map
  const pins = [...document.querySelectorAll(".pin-item")].map((pinItem) => {
    const btn = pinItem.querySelector(".pin-button");
    return {
      el: pinItem,
      id: btn?.getAttribute("data-pin"),
      lat: parseFloat(btn?.getAttribute("data-lat")),
      lng: parseFloat(btn?.getAttribute("data-lng")),
    };
  }).filter((p) => p.id && !isNaN(p.lat) && !isNaN(p.lng));

  if (!mapBtns.length || !pins.length) return;

  // Detach pin elements before Mapbox wipes the container
  pins.forEach(({ el }) => el.remove());

  mapboxgl.accessToken = MAPBOX_TOKEN;

  // Determine initial center from the first active map-button (or first button)
  const initialBtn = mapBtns.find((b) => b.classList.contains("active")) || mapBtns[0];
  const initialLat = parseFloat(initialBtn.getAttribute("data-lat"));
  const initialLng = parseFloat(initialBtn.getAttribute("data-lng"));

  const map = new mapboxgl.Map({
    container: mapEl,
    style: MAPBOX_STYLE,
    center: [initialLng, initialLat],
    zoom: MAPBOX_ZOOM,
  });

  function goTo(id, lat, lng) {
    mapBtns.forEach((b) => b.classList.remove("active"));
    mapBtns.find((b) => b.getAttribute("data-map") === id)?.classList.add("active");
    map.flyTo({ center: [lng, lat], zoom: MAPBOX_ZOOM + 2, essential: true });
  }

  // Add markers + click handlers once the map style is ready
  map.on("load", () => {
    pins.forEach(({ el, id, lat, lng }) => {
      new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(map);

      el.querySelector(".pin-button")?.addEventListener("click", () => goTo(id, lat, lng));
    });
  });

  mapBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      goTo(
        btn.getAttribute("data-map"),
        parseFloat(btn.getAttribute("data-lat")),
        parseFloat(btn.getAttribute("data-lng"))
      );
    });
  });
}
