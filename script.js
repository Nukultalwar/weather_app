// Clean Weather App - Simple & Responsive
// Free OpenWeatherMap API key (replace with your own for production)

const API_KEY = '68d99bcaeec40107f5f7a242b5ae7d6c'; // Demo key - get yours at openweathermap.org
const API_KEY = '68d99bcaeec40107f5f7a242b5ae7d6c'; // Demo - replace with your own
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const WEATHER_URL = 'https://api.openweathermap.org/data/3.0/onecall';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMsg = document.getElementById('errorMsg');
const weatherCard = document.getElementById('weatherCard');
const cityNameEl = document.getElementById('cityName');
const currentTimeEl = document.getElementById('currentTime');
const weatherIconEl = document.getElementById('weatherIcon');
const temperatureEl = document.getElementById('temperature');
const conditionEl = document.getElementById('condition');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('windSpeed');
const precipEl = document.getElementById('precip');
const feelsLikeEl = document.getElementById('feelsLike');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const aqiValueEl = document.getElementById('aqiValue');
const aqiLabelEl = document.getElementById('aqiLabel');
const forecastList = document.getElementById('forecastList');
const recentSearchesEl = document.getElementById('recentSearches');
const hourlyToggle = document.getElementById('hourlyToggle');
const hourlyList = document.getElementById('hourlyList');
const weatherMapEl = document.getElementById('weatherMap');
const geoBtn = document.getElementById('geoBtn');
const unitToggle = document.getElementById('unitToggle');

// Weather condition to icon mapping
const weatherIcons = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️',
    default: '🌤️'
};

// Background themes
const weatherBackgrounds = {
    'Clear': 'clear',
    'Clouds': 'cloudy',
    'Rain': 'rainy',
    'Drizzle': 'rainy',
    'Thunderstorm': 'thunder',
    'Snow': 'snowy',
    'Mist': 'cloudy',
    default: 'clear'
};

// State
let isMetric = true;
let recentSearches = JSON.parse(localStorage.getItem('weatherRecent')) || [];

// Update current time
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    const dateString = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    currentTimeEl.textContent = `${timeString}, ${dateString}`;
}

// Add to recent searches
function addRecentSearch(city, lat, lon) {
    const search = {city, lat: lat.toFixed(4), lon: lon.toFixed(4)};
    const index = recentSearches.findIndex(s => s.city === city);
    if (index > -1) recentSearches.splice(index, 1);
    recentSearches.unshift(search);
    recentSearches = recentSearches.slice(0,5);
    localStorage.setItem('weatherRecent', JSON.stringify(recentSearches));
    updateRecentSearches();
}

// Update recent searches UI
function updateRecentSearches() {
    recentSearchesEl.innerHTML = recentSearches.map(s => 
        `<div class="recent-item" onclick="loadCity('${s.city}', ${s.lat}, ${s.lon})">${s.city}</div>`
    ).join('');
}

// Load city from recent
function loadCity(city, lat, lon) {
    cityInput.value = city;
    searchWeatherWithCoords(lat, lon);
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    updateTime();
    setInterval(updateTime, 60000);
    
    updateRecentSearches();
    
    // Event listeners
    searchBtn.addEventListener('click', searchWeather);
    geoBtn.addEventListener('click', getCurrentLocation);
    unitToggle.addEventListener('click', toggleUnits);
    hourlyToggle.addEventListener('click', toggleHourly);
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });
    
    // Default London
    cityInput.value = 'London';
    searchWeather();
});

// Get current location
async function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation not supported');
        return;
    }
    
    showLoading(true);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const {latitude, longitude} = position.coords;
            searchWeatherWithCoords(latitude, longitude);
        },
        (error) => {
            showLoading(false);
            showError('Location access denied');
        },
        {enableHighAccuracy: true, timeout: 10000}
    );
}

// Toggle units
function toggleUnits() {
    isMetric = !isMetric;
    unitToggle.textContent = isMetric ? '°C' : '°F';
    localStorage.setItem('weatherUnits', isMetric.toString());
    // Re-fetch current with new units if data available
    if (cityInput.value) searchWeather();
}

// Toggle hourly
function toggleHourly() {
    hourlyList.classList.toggle('hidden');
    hourlyToggle.textContent = hourlyList.classList.contains('hidden') ? 'Hourly Forecast' : 'Hide Hourly';
}

// Get lat/lon from city name
async function getLocationFromCity(city) {
    const response = await fetch(`${GEO_URL}?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`);
    if (!response.ok) throw new Error('City not found');
    const data = await response.json();
    if (data.length === 0) throw new Error('City not found');
    return {lat: data[0].lat, lon: data[0].lon, country: data[0].country};
}

// Main search (city name)
async function searchWeather() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    try {
        showLoading(true);
        hideError();
        const loc = await getLocationFromCity(city);
        addRecentSearch(city, loc.lat, loc.lon);
        searchWeatherWithCoords(loc.lat, loc.lon);
    } catch (error) {
        showLoading(false);
        showError(error.message);
    }
}

// Search with coordinates (geo or recent)
async function searchWeatherWithCoords(lat, lon) {
    const units = isMetric ? 'metric' : 'imperial';
    const response = await fetch(`${WEATHER_URL}?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${API_KEY}&units=${units}`);
    if (!response.ok) throw new Error('Weather data unavailable');
    const data = await response.json();
    displayWeatherData(data);
    showLoading(false);
}

// Display One Call weather data
function displayWeatherData(oneCallData) {
    const current = oneCallData.current;
    const city = cityInput.value || 'Current location';
    const condition = current.weather[0].main;
    
    cityNameEl.textContent = city;
    const temp = Math.round(current.temp);
    temperatureEl.textContent = `${temp}${isMetric ? '°C' : '°F'}`;
    conditionEl.textContent = current.weather[0].description;
    weatherIconEl.textContent = weatherIcons[condition] || weatherIcons.default;
    
    // Details
    humidityEl.textContent = `${current.humidity}%`;
    const windMs = current.wind_speed;
    windSpeedEl.textContent = `${(windMs * 3.6).toFixed(1)} km/h`;
    precipEl.textContent = `${(current.pop * 100 || 0).toFixed(0)}%`;
    feelsLikeEl.textContent = `Feels like ${Math.round(current.feels_like)}${isMetric ? '°C' : '°F'}`;
    
    // Sun times
    sunriseEl.textContent = new Date(current.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    sunsetEl.textContent = new Date(current.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // AQI mock (simple formula)
    const aqi = Math.min(5, Math.round((current.humidity / 20) + (windMs * 2)));
    aqiValueEl.textContent = aqi;
    const aqiLabels = ['Good','Fair','Moderate','Poor','Very Poor'];
    aqiLabelEl.textContent = aqiLabels[aqi-1] || 'Good';
    
    // Background
    document.body.className = weatherBackgrounds[condition] || 'clear';
    
    // Thermal
    updateThermalMap(current.temp, city, '');
    
    // Forecast
    updateForecast(oneCallData.daily);
    
    // Map (OpenWeather tile example - requires static URL)
    const mapUrl = `https://tile.openweathermap.org/map/clouds_new/10/0/0.png?appid=${API_KEY}`; // Placeholder - customize with lat/lon zoom
    weatherMapEl.src = mapUrl;
    document.getElementById('mapSection').style.display = 'block';
    
    showWeatherCard();
}

// Update 5-day forecast
function updateForecast(daily) {
    forecastList.innerHTML = daily.slice(1,6).map((day, i) => {
        const date = new Date((day.dt + 86400) * 1000); // +1 day offset
        const dayName = date.toLocaleDateString('en-US', {weekday: 'short'});
        const icon = weatherIcons[day.weather[0].main] || '🌤️';
        const high = Math.round(day.temp.max);
        const low = Math.round(day.temp.min);
        return `
            <div class="forecast-card">
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-icon">${icon}</div>
                <div class="forecast-temps">
                    <span class="forecast-high">${high}${isMetric ? '°' : '°'}</span>
                    <span>${low}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Update hourly (simplified - first 24)
function updateHourly(hourly) {
    hourlyList.innerHTML = '<div class="hourly-grid">' + hourly.slice(0,24).map(h => {
        const time = new Date(h.dt * 1000).toLocaleTimeString([], {hour: 'numeric'});
        const icon = weatherIcons[h.weather[0].main]?.slice(0,2) || '🌤️';
        return `
            <div class="hourly-item">
                <div class="hourly-time">${time}</div>
                <span class="hourly-temp">${Math.round(h.temp)}${isMetric ? '°' : '°'}</span>
                <div class="hourly-precip">${(h.pop*100||0).toFixed(0)}%</div>
            </div>
        `;
    }).join('') + '</div>';
}

// Update thermal heat map
function updateThermalMap(temp, city, country) {
    const thermalSection = document.getElementById('thermalSection');
    const thermalTemp = document.getElementById('thermalTemp');
    const thermalRange = document.getElementById('thermalRange');
    
    thermalTemp.textContent = `${Math.round(temp)}${isMetric ? '°C' : '°F'}`;
    
    // Color gradient based on temperature (thermal)
    let centerColor, midColor, edgeColor;
    const t = isMetric ? temp : (temp - 32) * 5/9;
    if (t < 0) {
        centerColor = '#00d4ff'; midColor = '#00b7eb'; edgeColor = '#0099cc';
    } else if (t < 10) {
        centerColor = '#4ecdc4'; midColor = '#44a08d'; edgeColor = '#2f8c7a';
    } else if (t < 20) {
        centerColor = '#45b7d1'; midColor = '#3498db'; edgeColor = '#2980b9';
    } else if (t < 30) {
        centerColor = '#f39c12'; midColor = '#e67e22'; edgeColor = '#d68910';
    } else {
        centerColor = '#e74c3c'; midColor = '#c0392b'; edgeColor = '#a93226';
    }
    
    document.getElementById('centerTemp').setAttribute('stop-color', centerColor);
    document.getElementById('midTemp').setAttribute('stop-color', midColor);
    document.getElementById('edgeTemp').setAttribute('stop-color', edgeColor);
    
    // Mock country side temps
    const avgLow = Math.max(0, Math.round(t - 4));
    const avgHigh = Math.round(t + 4);
    const sideTemp = Math.round(t - 2);
    thermalRange.innerHTML = `Country avg: ${avgLow}-${avgHigh}${isMetric ? '°C' : '°F'} <span class="country-side">Sides: ${sideTemp}${isMetric ? '°C' : '°F'}</span>`;
    
    thermalSection.style.display = 'block';
}

// UI Control Functions
function showLoading(show = true) {
    loadingEl.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    errorMsg.textContent = message;
    errorEl.classList.remove('hidden');
}

function hideError() {
    errorEl.classList.add('hidden');
}

function hideWeatherCard() {
    weatherCard.classList.add('hidden');
}

function showWeatherCard() {
    weatherCard.classList.remove('hidden');
}
