const apiKey="7e6cf8bf636045eca4c6512748c52ab6";

const useProxy = false;  
const proxy = "";         

function getLocation() {
  const cache = JSON.parse(localStorage.getItem('cachedLocation') || '{}');
  const now = Date.now();

  // Use cached location if less than 10 minutes old
  if (cache.timestamp && now - cache.timestamp < 10 * 60 * 1000) {
    useLocation(cache.lat, cache.lng);
  } else {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        localStorage.setItem(
          'cachedLocation',
          JSON.stringify({ lat, lng, timestamp: now })
        );

        useLocation(lat, lng);
      },
      () => alert("Location access denied or unavailable.")
    );
  }
}

async function useLocation(lat, lng) {
  // Geoapify Nearby Places endpoint
  const endpoint = `https://api.geoapify.com/v2/places?categories=catering.cafe&filter=circle:${lng},${lat},1500&bias=proximity:${lng},${lat}&limit=20&apiKey=${apiKey}`;

  const url = useProxy ? proxy + endpoint : endpoint;

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);

    // Example: list cafe names
    data.features.forEach(place => {
      console.log(place.properties.name);
    });

  } catch (error) {
    console.error("Error fetching places:", error);
  }
}


function displayCards(cafes){
    const container=document.querySelector('.cards');
    container.innerHTML=''; 
    cafes.forEach((cafe, i) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'swipe-wrapper';
  wrapper.style.zIndex = 200 - i;

  var newCards = document.querySelectorAll('.location-card:not(.removed)');
  var allCards = document.querySelectorAll('.location-card');
  });
}
