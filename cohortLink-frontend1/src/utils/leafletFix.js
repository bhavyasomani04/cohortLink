/**
 * leafletFix.js
 *
 * Leaflet has a known issue with bundlers (Vite/Webpack) where the default
 * marker icon images cannot be resolved at runtime. This one-time fix
 * manually wires the icon assets to Leaflet's Icon.Default prototype.
 *
 * Import this file ONCE — at the top of any component that uses React-Leaflet.
 * It is idempotent and safe to import multiple times.
 */

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Delete the internal URL getter that breaks in bundlers
delete L.Icon.Default.prototype._getIconUrl;

// Re-supply the resolved asset URLs
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});
