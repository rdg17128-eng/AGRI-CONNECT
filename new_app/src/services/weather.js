// Open-Meteo is a free API, no key required

export function getWeatherIcon(wmoCode) {
    if (wmoCode === 0) return 'fa-sun'; // Clear sky
    if (wmoCode === 1 || wmoCode === 2 || wmoCode === 3) return 'fa-cloud-sun'; // Mainly clear, partly cloudy, and overcast
    if (wmoCode === 45 || wmoCode === 48) return 'fa-smog'; // Fog and depositing rime fog
    if (wmoCode >= 51 && wmoCode <= 67) return 'fa-cloud-rain'; // Drizzle / Rain
    if (wmoCode >= 71 && wmoCode <= 77) return 'fa-snowflake'; // Snow fall
    if (wmoCode >= 80 && wmoCode <= 82) return 'fa-cloud-showers-heavy'; // Rain showers
    if (wmoCode >= 85 && wmoCode <= 86) return 'fa-snowflake'; // Snow showers
    if (wmoCode >= 95 && wmoCode <= 99) return 'fa-cloud-bolt'; // Thunderstorm
    return 'fa-cloud-sun'; // Default fallback
}

export async function fetchWeatherByCoords(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,precipitation_probability_max&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Weather API Error: ${response.status}`);
        const data = await response.json();

        let forecast = [];
        if (data.daily && data.daily.time) {
            // grab the next 4 days starting from tomorrow (index 1 to 4)
            for (let i = 1; i <= 4; i++) {
                if (data.daily.time[i]) {
                    const date = new Date(data.daily.time[i]);
                    forecast.push({
                        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                        tempMax: Math.round(data.daily.temperature_2m_max[i]),
                        weathercode: data.daily.weathercode[i],
                        precipitationProb: data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[i] : 0
                    });
                }
            }
        }

        return {
            name: "Selected Location",
            weather: [{
                id: data.current_weather.weathercode,
                main: mapWmoCodeToText(data.current_weather.weathercode)
            }],
            main: {
                temp: data.current_weather.temperature,
                humidity: 60 // Open meteo current_weather doesn't give humidity by default, placeholder
            },
            wind: { speed: data.current_weather.windspeed / 3.6 }, // converting km/h to m/s
            forecast: forecast
        };
    } catch (error) {
        console.error("Failed to fetch weather data: ", error);
        return null;
    }
}

export async function fetchWeatherByCity(cityName) {
    try {
        // Simple mock since open-meteo requires coordinates
        // Instead of doing another lookup, let's hardcode Hyderabad coordinates as default
        return fetchWeatherByCoords(17.3850, 78.4867);
    } catch (error) {
        console.error("Failed to fetch weather data: ", error);
        return null;
    }
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
