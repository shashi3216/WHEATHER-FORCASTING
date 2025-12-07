document.addEventListener('DOMContentLoaded', function() {
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const locationBtn = document.getElementById('locationBtn');
    const weatherDisplay = document.getElementById('weatherDisplay');
    const forecastSection = document.getElementById('forecastSection');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    // MY API Key
    const API_KEY = '017b7b95b8475c435efcd577bdaeed41';

    // Map weather icons to FontAwesome classes
    const weatherIcons = {
        '01d': 'fas fa-sun weather-sunny',
        '01n': 'fas fa-moon weather-sunny',
        '02d': 'fas fa-cloud-sun weather-cloudy',
        '02n': 'fas fa-cloud-moon weather-cloudy',
        '03d': 'fas fa-cloud weather-cloudy',
        '03n': 'fas fa-cloud weather-cloudy',
        '04d': 'fas fa-cloud weather-cloudy',
        '04n': 'fas fa-cloud weather-cloudy',
        '09d': 'fas fa-cloud-showers-heavy weather-rainy',
        '09n': 'fas fa-cloud-showers-heavy weather-rainy',
        '10d': 'fas fa-cloud-sun-rain weather-rainy',
        '10n': 'fas fa-cloud-moon-rain weather-rainy',
        '11d': 'fas fa-bolt weather-stormy',
        '11n': 'fas fa-bolt weather-stormy',
        '13d': 'fas fa-snowflake weather-snowy',
        '13n': 'fas fa-snowflake weather-snowy',
        '50d': 'fas fa-smog weather-cloudy',
        '50n': 'fas fa-smog weather-cloudy'
    };

    // Event listeners
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    });

    locationBtn.addEventListener('click', getLocationWeather);

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                getWeatherData(city);
            }
        }
    });

    // Get weather data by city name
    async function getWeatherData(city) {
        showLoading();
        hideError();

        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
            );

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('City not found. Please check the spelling and try again.');
                } else {
                    throw new Error('API error. Please try again later.');
                }
            }

            const data = await response.json();
            displayWeatherData(data);
            getForecastData(data.coord.lat, data.coord.lon);
        } catch (error) {
            showError(error.message);
            hideLoading();
        }
    }

    // Get weather by geolocation
    async function getLocationWeather() {
        if (navigator.geolocation) {
            showLoading();
            hideError();

            navigator.geolocation.getCurrentPosition(
                async position => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const response = await fetch(
                            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
                        );

                        if (!response.ok) {
                            throw new Error('Unable to fetch weather for your location.');
                        }

                        const data = await response.json();
                        data.name = 'Current Location';
                        displayWeatherData(data);
                        getForecastData(latitude, longitude);
                    } catch (error) {
                        showError(error.message);
                        hideLoading();
                    }
                },
                error => {
                    hideLoading();
                    showError('Unable to get your location. Please ensure location services are enabled.');
                }
            );
        } else {
            showError('Geolocation is not supported by your browser.');
        }
    }

    // Get 5-day forecast
    async function getForecastData(lat, lon) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
            );

            if (!response.ok) {
                throw new Error('Unable to fetch forecast data.');
            }

            const forecastData = await response.json();
            displayForecastData(forecastData);
        } catch (error) {
            console.error('Forecast error:', error);
        } finally {
            hideLoading();
        }
    }

    // Display weather data
    function displayWeatherData(data) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

        document.getElementById('cityName').textContent = `${data.name}${data.sys.country ? ', ' + data.sys.country : ''}`;
        document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);
        document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
        document.getElementById('weatherDescription').textContent = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
        document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('windSpeed').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        document.getElementById('visibility').textContent = data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A';
        document.getElementById('cloudiness').textContent = `${data.clouds.all}%`;

        // Set weather icon
        const weatherIcon = document.getElementById('weatherIcon');
        weatherIcon.className = weatherIcons[data.weather[0].icon] || 'fas fa-question weather-cloudy';
        weatherIcon.style.fontSize = '3rem';

        weatherDisplay.style.display = 'block';
        forecastSection.style.display = 'block';

        // Add fade-in animation
        weatherDisplay.classList.add('fade-in');
        forecastSection.classList.add('fade-in');
    }

    // Display forecast data
    function displayForecastData(forecastData) {
        const forecastContainer = document.getElementById('forecastContainer');
        forecastContainer.innerHTML = '';

        // Process forecast data to show one reading per day
        const dailyForecasts = {};
        forecastData.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = item;
            }
        });

        const forecastEntries = Object.values(dailyForecasts).slice(0, 5);

        forecastEntries.forEach((forecast, index) => {
            const date = new Date(forecast.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            const forecastDay = document.createElement('div');
            forecastDay.className = 'forecast-day fade-in';
            forecastDay.style.animationDelay = `${index * 0.1}s`;

            forecastDay.innerHTML = `
                <p class="font-semibold mb-2">${dayName}</p>
                <i class="${weatherIcons[forecast.weather[0].icon] || 'fas fa-question'} text-3xl text-blue-500 mb-2"></i>
                <p class="text-lg font-medium">${Math.round(forecast.main.temp)}°C</p>
                <p class="text-xs text-gray-600">${forecast.weather[0].description.charAt(0).toUpperCase() + forecast.weather[0].description.slice(1)}</p>
            `;

            forecastContainer.appendChild(forecastDay);
        });
    }

    // Utility functions
    function showLoading() {
        loading.style.display = 'block';
        weatherDisplay.style.display = 'none';
        forecastSection.style.display = 'none';
    }

    function hideLoading() {
        loading.style.display = 'none';
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.classList.add('error-state');
    }

    function hideError() {
        errorMessage.style.display = 'none';
        errorMessage.classList.remove('error-state');
    }

    // Initialize with a default city (optional)
    getWeatherData('Delhi');
});