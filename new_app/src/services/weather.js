// OpenWeather API key integration

export function getWeatherIcon(code) {
    if (code >= 200) {
        // OpenWeather codes
        if (code >= 200 && code < 300) return 'fa-cloud-bolt'; // Thunderstorm
        if (code >= 300 && code < 400) return 'fa-cloud-rain'; // Drizzle
        if (code >= 500 && code < 600) return 'fa-cloud-showers-heavy'; // Rain
        if (code >= 600 && code < 700) return 'fa-snowflake'; // Snow
        if (code >= 700 && code < 800) return 'fa-smog'; // Fog/Atmosphere
        if (code === 800) return 'fa-sun'; // Clear sky
        if (code > 800) return 'fa-cloud-sun'; // Clouds
        return 'fa-cloud-sun';
    } else {
        // WMO codes (Open-Meteo fallback)
        if (code === 0) return 'fa-sun';
        if (code === 1 || code === 2 || code === 3) return 'fa-cloud-sun';
        if (code === 45 || code === 48) return 'fa-smog';
        if (code >= 51 && code <= 67) return 'fa-cloud-rain';
        if (code >= 71 && code <= 77) return 'fa-snowflake';
        if (code >= 80 && code <= 82) return 'fa-cloud-showers-heavy';
        if (code >= 85 && code <= 86) return 'fa-snowflake';
        if (code >= 95 && code <= 99) return 'fa-cloud-bolt';
        return 'fa-cloud-sun';
    }
}

export async function fetchWeatherByCoords(lat, lon) {
    try {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || '06513cac2812fa0f1b3446212d64f94d';
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const forecastWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

        const [currentRes, forecastRes] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastWeatherUrl)
        ]);

        if (!currentRes.ok || !forecastRes.ok) {
            console.warn(`OpenWeather failed with status: ${currentRes.status} / ${forecastRes.status}. Falling back to Open-Meteo.`);
            return fetchWeatherFromOpenMeteo(lat, lon);
        }

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        // Process forecast list into 4 daily entries
        const dailyForecasts = {};
        const todayStr = new Date().toISOString().split('T')[0];

        forecastData.list.forEach(item => {
            const dateStr = item.dt_txt.split(' ')[0];
            if (dateStr === todayStr) return; // skip today

            if (!dailyForecasts[dateStr]) {
                dailyForecasts[dateStr] = {
                    temps: [],
                    weathercodes: [],
                    date: new Date(item.dt * 1000)
                };
            }
            dailyForecasts[dateStr].temps.push(item.main.temp_max);
            dailyForecasts[dateStr].weathercodes.push(item.weather[0].id);
        });

        const forecast = Object.keys(dailyForecasts).slice(0, 4).map(dateStr => {
            const dayData = dailyForecasts[dateStr];
            const tempMax = Math.round(Math.max(...dayData.temps));
            const weathercode = dayData.weathercodes[Math.floor(dayData.weathercodes.length / 2)] || dayData.weathercodes[0];
            return {
                dayName: dayData.date.toLocaleDateString('en-US', { weekday: 'short' }),
                tempMax: tempMax,
                weathercode: weathercode,
                precipitationProb: 0
            };
        });

        return {
            name: currentData.name || "Selected Location",
            weather: [{
                id: currentData.weather[0].id,
                main: currentData.weather[0].main
            }],
            main: {
                temp: currentData.main.temp,
                humidity: currentData.main.humidity
            },
            wind: {
                speed: currentData.wind.speed * 3.6 // convert m/s to km/h
            },
            forecast: forecast
        };
    } catch (error) {
        console.warn("OpenWeather fetch error. Falling back to Open-Meteo.", error);
        return fetchWeatherFromOpenMeteo(lat, lon);
    }
}

export async function fetchWeatherByCity(cityName = 'Hyderabad') {
    try {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || '06513cac2812fa0f1b3446212d64f94d';
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=metric`;
        const forecastWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=metric`;

        const [currentRes, forecastRes] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastWeatherUrl)
        ]);

        if (!currentRes.ok || !forecastRes.ok) {
            console.warn(`OpenWeather failed for city ${cityName}. Falling back to Open-Meteo.`);
            const coords = await getCoordsByCity(cityName);
            if (coords) {
                const wData = await fetchWeatherFromOpenMeteo(coords.lat, coords.lon);
                if (wData) {
                    wData.name = coords.name;
                    return wData;
                }
            }
            return fetchWeatherByCoords(17.3850, 78.4867); // fallback to Hyderabad coords
        }

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        // Process forecast list into 4 daily entries
        const dailyForecasts = {};
        const todayStr = new Date().toISOString().split('T')[0];

        forecastData.list.forEach(item => {
            const dateStr = item.dt_txt.split(' ')[0];
            if (dateStr === todayStr) return; // skip today

            if (!dailyForecasts[dateStr]) {
                dailyForecasts[dateStr] = {
                    temps: [],
                    weathercodes: [],
                    date: new Date(item.dt * 1000)
                };
            }
            dailyForecasts[dateStr].temps.push(item.main.temp_max);
            dailyForecasts[dateStr].weathercodes.push(item.weather[0].id);
        });

        const forecast = Object.keys(dailyForecasts).slice(0, 4).map(dateStr => {
            const dayData = dailyForecasts[dateStr];
            const tempMax = Math.round(Math.max(...dayData.temps));
            const weathercode = dayData.weathercodes[Math.floor(dayData.weathercodes.length / 2)] || dayData.weathercodes[0];
            return {
                dayName: dayData.date.toLocaleDateString('en-US', { weekday: 'short' }),
                tempMax: tempMax,
                weathercode: weathercode,
                precipitationProb: 0
            };
        });

        return {
            name: currentData.name || cityName,
            weather: [{
                id: currentData.weather[0].id,
                main: currentData.weather[0].main
            }],
            main: {
                temp: currentData.main.temp,
                humidity: currentData.main.humidity
            },
            wind: {
                speed: currentData.wind.speed * 3.6
            },
            forecast: forecast
        };
    } catch (error) {
        console.warn(`OpenWeather fetch error for city ${cityName}. Falling back to Open-Meteo.`, error);
        const coords = await getCoordsByCity(cityName);
        if (coords) {
            const wData = await fetchWeatherFromOpenMeteo(coords.lat, coords.lon);
            if (wData) {
                wData.name = coords.name;
                return wData;
            }
        }
        return fetchWeatherByCoords(17.3850, 78.4867);
    }
}

// Fallback logic helpers using Open-Meteo (No API key needed)

async function fetchWeatherFromOpenMeteo(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,precipitation_probability_max&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Open-Meteo API Error: ${response.status}`);
        const data = await response.json();

        let forecast = [];
        if (data.daily && data.daily.time) {
            for (let i = 1; i <= 4; i++) {
                if (data.daily.time[i]) {
                    const date = new Date(data.daily.time[i]);
                    forecast.push({
                        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                        tempMax: Math.round(data.daily.temperature_2m_max[i]),
                        weathercode: data.daily.weathercode[i], // WMO code
                        precipitationProb: data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[i] : 0
                    });
                }
            }
        }

        return {
            name: "Selected Location",
            weather: [{
                id: data.current_weather.weathercode, // WMO code
                main: mapWmoCodeToText(data.current_weather.weathercode)
            }],
            main: {
                temp: data.current_weather.temperature,
                humidity: 60
            },
            wind: {
                speed: data.current_weather.windspeed // km/h
            },
            forecast: forecast
        };
    } catch (err) {
        console.error("Open-Meteo fallback also failed:", err);
        return null;
    }
}

async function getCoordsByCity(cityName) {
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            return {
                lat: data.results[0].latitude,
                lon: data.results[0].longitude,
                name: data.results[0].name
            };
        }
    } catch (e) {
        console.error("Geocoding failed:", e);
    }
    return null;
}

function mapWmoCodeToText(wmoCode) {
    if (wmoCode === 0) return 'Clear';
    if (wmoCode <= 3) return 'Cloudy';
    if (wmoCode <= 48) return 'Foggy';
    if (wmoCode <= 67) return 'Rain';
    if (wmoCode <= 77) return 'Snow';
    if (wmoCode <= 82) return 'Showers';
    if (wmoCode <= 86) return 'Snow Showers';
    if (wmoCode >= 95) return 'Thunderstorm';
    return 'Unknown';
}


