// Clean Weather App - Simple & Responsive
// Free OpenWeatherMap API key (replace with your own for production)

const API_KEY = '68d99bcaeec40107f5f7a242b5ae7d6c'; // Demo key - get yours at openweathermap.org
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

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

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    updateTime();
    setInterval(updateTime, 60000); // Update every minute
    
    // Event listeners
    searchBtn.addEventListener('click', searchWeather);
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });
    
    // Default load for London
    cityInput.value = 'London';
    searchWeather();
});

// Main search function
async function searchWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    showLoading(true);
    hideError();
    hideWeatherCard();
    
    try {
        const response = await fetch(`${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
        
        if (!response.ok) {
            throw new Error(`City "${city}" not found`);
        }
        
        const data = await response.json();
        displayWeather(data);
        
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Display weather data
function displayWeather(data) {
    // Update main info
    const fullName = data.name;
    const country = data.sys.country;
    cityNameEl.textContent = `${fullName}, ${country}`;
    
    temperatureEl.textContent = `${Math.round(data.main.temp)}°C`;
    conditionEl.textContent = data.weather[0].description;
    
    // Weather icon
    const condition = data.weather[0].main;
    weatherIconEl.textContent = weatherIcons[condition] || weatherIcons.default;
    
    // Details
    humidityEl.textContent = `${data.main.humidity}%`;
    windSpeedEl.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
    
    // Dynamic background
    const bgTheme = weatherBackgrounds[condition] || weatherBackgrounds.default;
    document.body.className = bgTheme;
    
    // Thermal heat map
    updateThermalMap(data.main.temp, fullName, country);
    
    // Show card
    showWeatherCard();
}

// Update thermal heat map
function updateThermalMap(temp, city, country) {
    const thermalSection = document.getElementById('thermalSection');
    const thermalTemp = document.getElementById('thermalTemp');
    const thermalRange = document.getElementById('thermalRange');
    
    thermalTemp.textContent = `${Math.round(temp)}°C`;
    
    // Color gradient based on temperature (thermal)
    let centerColor, midColor, edgeColor;
    if (temp < 0) {
        centerColor = '#00d4ff'; midColor = '#00b7eb'; edgeColor = '#0099cc';
    } else if (temp < 10) {
        centerColor = '#4ecdc4'; midColor = '#44a08d'; edgeColor = '#2f8c7a';
    } else if (temp < 20) {
        centerColor = '#45b7d1'; midColor = '#3498db'; edgeColor = '#2980b9';
    } else if (temp < 30) {
        centerColor = '#f39c12'; midColor = '#e67e22'; edgeColor = '#d68910';
    } else {
        centerColor = '#e74c3c'; midColor = '#c0392b'; edgeColor = '#a93226';
    }
    
    document.getElementById('centerTemp').setAttribute('stop-color', centerColor);
    document.getElementById('midTemp').setAttribute('stop-color', midColor);
    document.getElementById('edgeTemp').setAttribute('stop-color', edgeColor);
    
    // Mock country side temps (simple range based on main temp)
    const avgLow = Math.max(0, Math.round(temp - 4));
    const avgHigh = Math.round(temp + 4);
    const sideTemp = Math.round(temp - 2);
    thermalRange.innerHTML = `Country avg: ${avgLow}-${avgHigh}°C <span class="country-side">Sides: ${sideTemp}°C</span>`;
    
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
