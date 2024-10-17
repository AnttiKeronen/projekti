const kaupunkiSyö = document.querySelector(".kaupunkisyöte");
const hakuNap = document.querySelector(".säänsyöte");
const sijaintiNap = document.querySelector(".sijaintinappi");
const lempparitNap = document.querySelector(".lempparitnappi");
const yksikönvaihtoNap = document.querySelector(".yksikönvaihtonappi");
const sääNy = document.querySelector(".säänyt");
const tulevanSäänBo = document.querySelector(".tulevansäänboksit");
const sääBo = document.querySelector(".sääboksi");
const lempparitLis = document.querySelector(".lempparitlista");
const avaaLempparitNap = document.querySelector(".avaalempparitnappi");

const API_KEY = "8f5aed2ec991f89e8852a5efd2745e20";
let currentUnit = "C"; 
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

const createWeatherCard = (cityName, weatherItem, index) => {
    const tempInCelsius = weatherItem.main.temp - 273.15;
    let displayedTemp = tempInCelsius;
    let unitSymbol = "C"
    //Yksiköitten vaihto
    if (currentUnit === "F") {
        displayedTemp = (tempInCelsius * 9 / 5) + 32;
        unitSymbol = "F";
    } else if (currentUnit === "K") {
        displayedTemp = tempInCelsius + 273.15;
    }

    const temperature = `${displayedTemp.toFixed(2)}°${unitSymbol}`;
    adjustBackgroundColor(tempInCelsius);

    if (index === 0) {    //Koostumus
        return `
            <div class="details">
                <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                <h4>Temperature: ${temperature}</h4>
                <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
                <h4>Humidity: ${weatherItem.main.humidity}%</h4>
            </div>
            <div class="icon">
                <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon">
                <h4>${weatherItem.weather[0].description}</h4>
            </div>
        `;
    } else {
        return `
            <li class="card">
                <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon">
                <h4>Temp: ${temperature}</h4>
                <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
                <h4>Humidity: ${weatherItem.main.humidity}%</h4>
            </li>
        `;
    }
};



const adjustBackgroundColor = (tempInCelsius) => {
    let backgroundColor = "#ffffff"; 

    if (tempInCelsius < 10) {
        backgroundColor = "#b3e0ff"; 
    } else if (tempInCelsius >= 10 && tempInCelsius <= 25) {
        backgroundColor = "#ffe680"; 
    } else if (tempInCelsius > 25) {
        backgroundColor = "#ff9999"; 
    }

    const currentHour = new Date().getHours();
    if (currentHour >= 18 || currentHour < 6) {
        backgroundColor = darkenColor(backgroundColor, 0.5); 
    }

    sääBo.style.backgroundColor = backgroundColor;
};
//chat gpt help here
const darkenColor = (color, factor) => {
    const colorHex = color.replace("#", "");
    const r = parseInt(colorHex.substring(0, 2), 16);
    const g = parseInt(colorHex.substring(2, 4), 16);
    const b = parseInt(colorHex.substring(4, 6), 16);

    const newR = Math.floor(r * factor);
    const newG = Math.floor(g * factor);
    const newB = Math.floor(b * factor);

    return `rgb(${newR}, ${newG}, ${newB})`;
};

const getWeatherDetails = (cityName, lat, lon) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL)
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        if (data && data.list && data.list.length > 0) {
            const uniqueForecastDays = [];
            const fiveDaysForecast = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastDays.includes(forecastDate)) {
                    return uniqueForecastDays.push(forecastDate);
                }
            });

            kaupunkiSyö.value = "";
            sääNy.innerHTML = "";
            tulevanSäänBo.innerHTML = "";

            fiveDaysForecast.forEach((weatherItem, index) => {
                if (index === 0) {
                    sääNy.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                } else {
                    tulevanSäänBo.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                }
            });
            getHourlyWeather(lat, lon);
        } else {
            throw new Error("Invalid data.");
        }
    })
    .catch((error) => {
        console.error("Error fetching:", error.message);
        if (!sääNy.innerHTML || !tulevanSäänBo.innerHTML) {
            alert("No data, try again.");
        }
    });
};



const getCityCoordinates = () => {
    const cityName = kaupunkiSyö.value.trim();

    sääNy.innerHTML = "";    //älä poista tätä, poistaa virhe ilmotusken, tyhjentää
    tulevanSäänBo.innerHTML = "";

   
    if (!cityName) {
        return;  
    }

    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

    fetch(GEOCODING_API_URL)
        .then(res => res.json())
        .then(data => {
            if (!data.length) {
                alert("City not found. Please try another.");
                return;  //Poistuu jos ei löydä
            }
            const { name, lat, lon } = data[0];
            getWeatherDetails(name, lat, lon);  
        })
        .catch(() => {
            alert("There was an error. Please try again.");
        });
};


const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

            fetch(REVERSE_GEOCODING_URL).then(res => res.json()).then(data => {
                const { name } = data[0];
                getWeatherDetails(name, latitude, longitude);
            }).catch(() => {
                alert("Error in coordinates");
            });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Location denied");
            }
        }
    );
};


const addToFavorites = () => {
    const cityName = kaupunkiSyö.value.trim();
    if (cityName && !favorites.includes(cityName)) {
        if (favorites.length < 5) { 
            favorites.push(cityName);
            localStorage.setItem("favorites", JSON.stringify(favorites));
            alert(`${cityName} added to favorites!`);
        } else {
            alert("You can only have a maximum of 5 favorites.");
        }
    } else {
        alert(`${cityName} is already in favorites or empty.`);
    }
    kaupunkiSyö.value = "";  
};

const displayFavorites = () => {
    lempparitLis.innerHTML = "";
    if (favorites.length === 0) {
        lempparitLis.innerHTML = "<li>No favorites added.</li>";
        return;
    }

    favorites.forEach((fav, index) => {
        const listItem = document.createElement("li");
        listItem.textContent = fav;
        listItem.classList.add("favorite-item");

        listItem.addEventListener("click", () => {
            const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${fav}&limit=1&appid=${API_KEY}`;
            fetch(GEOCODING_API_URL).then(res => res.json()).then(data => {
                if (!data.length) return alert("City not found");
                const { name, lat, lon } = data[0];
                getWeatherDetails(name, lat, lon);  
            }).catch(() => {
                alert("Error fetching city data.");
            });
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "poistanappi";
        deleteButton.addEventListener("click", (e) => {
            e.stopPropagation();  
            favorites.splice(index, 1); 
            localStorage.setItem("favorites", JSON.stringify(favorites));  
            displayFavorites();  
        });

        listItem.appendChild(deleteButton);  
        lempparitLis.appendChild(listItem);  
    });
};


document.addEventListener("DOMContentLoaded", () => {
    yksikönvaihtoNap.addEventListener("click", () => {
        currentUnit = currentUnit === "C" ? "F" : "C";
        yksikönvaihtoNap.innerText = `Switch to °${currentUnit === "C" ? "F" : "C"}`;
        getCityCoordinates();
    });

    hakuNap.addEventListener("click", getCityCoordinates);
    sijaintiNap.addEventListener("click", getUserCoordinates);
    lempparitNap.addEventListener("click", addToFavorites);
    avaaLempparitNap.addEventListener("click", displayFavorites);
});
