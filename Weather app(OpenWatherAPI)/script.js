// API Configuration
const API_KEY = "f80a809ce080c002f3e2108a0586f6ab";  // Replace with your OpenWeatherMap API key
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// DOM Elements
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");

const locationEl = document.getElementById("location");
const dateEl = document.getElementById("date");
const tempEl = document.getElementById("temp");
const conditionsEl = document.getElementById("conditions");
const iconEl = document.getElementById("weather-icon");

const feelsLikeEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");

const forecastEl = document.getElementById("forecast");
const loadingEl = document.getElementById("loading");

// Init
document.addEventListener("DOMContentLoaded", () => {
    getLocationWeather();
});

// Event Listeners
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) getWeatherByCity(city);
});

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const city = cityInput.value.trim();
        if (city) getWeatherByCity(city);
    }
});

locationBtn.addEventListener("click", getLocationWeather);

// Helper functions
function showLoading() {
    loadingEl.style.display = "flex";
}

function hideLoading() {
    loadingEl.style.display = "none";
}

function updateDate() {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}

// API Calls
async function getWeatherByCity(city) {
    showLoading();
    try {
        const currentRes = await fetch(
            `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        const currentData = await currentRes.json();
        if (currentData.cod !== 200) throw new Error(currentData.message);

        const forecastRes = await fetch(
            `${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`
        );
        const forecastData = await forecastRes.json();

        updateUI(currentData, forecastData);
    } catch (err) {
        alert(`Error: ${err.message}`);
        hideLoading();
    }
}

async function getLocationWeather() {
    showLoading();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const currentRes = await fetch(
                        `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
                    );
                    const currentData = await currentRes.json();

                    const forecastRes = await fetch(
                        `${BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
                    );
                    const forecastData = await forecastRes.json();

                    updateUI(currentData, forecastData);
                } catch (err) {
                    alert(`Error: ${err.message}`);
                    hideLoading();
                }
            },
            (error) => {
                alert(`Geolocation error: ${error.message}`);
                getWeatherByCity("London");
            }
        );
    } else {
        alert("Geolocation not supported");
        getWeatherByCity("London");
    }
}

// UI Update
function updateUI(current, forecast) {
    // Current weather
    locationEl.textContent = `${current.name}, ${current.sys.country}`;
    updateDate();
    tempEl.textContent = `${Math.round(current.main.temp)}°C`;
    conditionsEl.textContent = current.weather[0].description;
    iconEl.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;

    feelsLikeEl.textContent = `Feels like: ${Math.round(current.main.feels_like)}°C`;
    humidityEl.textContent = `Humidity: ${current.main.humidity}%`;
    windEl.textContent = `Wind: ${Math.round(current.wind.speed * 3.6)} km/h`;

    // Forecast
    updateForecast(forecast);

    hideLoading();
}

function updateForecast(forecast) {
    const daily = {};
    forecast.list.forEach((item) => {
        const date = new Date(item.dt * 1000).toLocaleDateString("en-US");
        if (!daily[date]) daily[date] = [];
        daily[date].push(item);
    });

    const days = Object.keys(daily).slice(1, 6);
    forecastEl.innerHTML = "";

    days.forEach((day) => {
        const data = daily[day];
        const dayName = new Date(day).toLocaleDateString("en-US", { weekday: "short" });
        const avgTemp = data.reduce((sum, item) => sum + item.main.temp, 0) / data.length;
        const high = Math.max(...data.map((d) => d.main.temp_max));
        const low = Math.min(...data.map((d) => d.main.temp_min));
        const icon = data[Math.floor(data.length / 2)].weather[0].icon;

        const div = document.createElement("div");
        div.className = "forecast-item";
        div.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">
                <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
            </div>
            <div class="forecast-temp">
                <span class="forecast-high">${Math.round(high)}°</span>
                <span class="forecast-low">${Math.round(low)}°</span>
            </div>
        `;
        forecastEl.appendChild(div);
    });
}
