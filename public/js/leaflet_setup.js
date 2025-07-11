/*eslint-disable */
export const displayMap = (locations, duration) => {
  // Leaflet Map initialization
  var map = L.map('map', { zoomControl: false, dragging: false });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const points = [];
  const tourLastDay = duration.split(' ')[0] * 1;

  locations.forEach((loc, index) => {
    // location pin (each location is counted)
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="marker-pin">${index + 1}</div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 0]
    });

    // Calculate day range
    const currentDay = loc.day;
    const nextLocation = locations[index + 1];
    // If no next location, assume it's the last day
    const endDay = nextLocation ? nextLocation.day - 1 : tourLastDay;
    const dayText =
      currentDay === endDay
        ? `Day ${currentDay}`
        : `Days ${currentDay} – ${endDay}`;

    points.push([loc.coordinates[1], loc.coordinates[0]]);
    L.marker([loc.coordinates[1], loc.coordinates[0]], { icon })
      .addTo(map)
      .bindPopup(`<p><span>${dayText}:</span> ${loc.description}</p>`, {
        autoClose: false
      })
      .openPopup();
  });

  // fit the map zoom so it displays all the points
  const bounds = L.latLngBounds(points).pad(0.5);
  map.fitBounds(bounds);

  map.scrollWheelZoom.disable();
};
