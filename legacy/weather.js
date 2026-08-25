// Weather fetching logic using the provided API key
const API_KEY = "AIzaSyBB3wNiPDlsm2-_fpC6ou95q-KWvB1o-QM";
const CITY = "Hyderabad";

// Function mapping weather conditions to FontAwesome icons
function getWeatherIcon(conditionCode) {
    if (conditionCode >= 200 && conditionCode < 300) return 'fa-cloud-bolt'; // Thunderstorm
    if (conditionCode >= 300 && conditionCode < 600) return 'fa-cloud-rain'; // Drizzle / Rain
    if (conditionCode >= 600 && conditionCode < 700) return 'fa-snowflake'; // Snow
    if (conditionCode >= 700 && conditionCode < 800) return 'fa-smog'; // Atmosphere (Mist, Smoke)
    if (conditionCode === 800) return 'fa-sun'; // Clear
    if (conditionCode === 801 || conditionCode === 802) return 'fa-cloud-sun'; // Few clouds
    if (conditionCode > 802) return 'fa-cloud'; // Overcast clouds

    return 'fa-cloud-sun'; // Default fallback
}

// Execute fetchWeather once the script runs since type="module" means the DOM is ready.
fetchWeather();

export async function fetchWeatherByCoords(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Weather API Error: ${response.status}`);
        }

        const data = await response.json();

        // Target UI Elements
        const tempEl = document.getElementById('weather-temp');
        const descEl = document.getElementById('weather-desc');
        const humidityEl = document.getElementById('weather-humidity');
        const windEl = document.getElementById('weather-wind');
        const locationEl = document.getElementById('weather-location');
        const iconEl = document.getElementById('weather-icon-main');

        // Update UI with real data
        if (tempEl) tempEl.textContent = `${Math.round(data.main.temp)}°C`;
        if (descEl) descEl.textContent = data.weather[0].main;
        if (humidityEl) humidityEl.textContent = `${data.main.humidity}%`;
        if (windEl) windEl.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // Convert m/s to km/h
        if (locationEl) locationEl.textContent = data.name;

        // Update Icon based on Weather Condition Code
        if (iconEl && data.weather.length > 0) {
            const code = data.weather[0].id;
            // Clear out all classes and add the correct ones
            iconEl.className = `fa-solid ${getWeatherIcon(code)}`;
        }

    } catch (error) {
        console.error("Failed to fetch weather data: ", error);
        // Silently fails and keeps the placeholder content visible
        // In a production app, we could handle this gracefully with fallback text
    }
}

async function fetchWeather() {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Weather API Error: ${response.status}`);
        }

        const data = await response.json();

        // Target UI Elements
        const tempEl = document.getElementById('weather-temp');
        const descEl = document.getElementById('weather-desc');
        const humidityEl = document.getElementById('weather-humidity');
        const windEl = document.getElementById('weather-wind');
        const locationEl = document.getElementById('weather-location');
        const iconEl = document.getElementById('weather-icon-main');

        // Update UI with real data
        if (tempEl) tempEl.textContent = `${Math.round(data.main.temp)}°C`;
        if (descEl) descEl.textContent = data.weather[0].main;
        if (humidityEl) humidityEl.textContent = `${data.main.humidity}%`;
        if (windEl) windEl.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // Convert m/s to km/h
        if (locationEl) locationEl.textContent = data.name;

        // Update Icon based on Weather Condition Code
        if (iconEl && data.weather.length > 0) {
            const code = data.weather[0].id;
            // Clear out all classes and add the correct ones
            iconEl.className = `fa-solid ${getWeatherIcon(code)}`;
        }

    } catch (error) {
        console.error("Failed to fetch weather data: ", error);
    }
}
