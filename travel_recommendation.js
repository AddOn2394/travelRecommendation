// Travel Recommendation JavaScript

// Get DOM elements
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const contactForm = document.getElementById('contactForm');

// Store fetched data
let travelData = null;

// Fetch travel data from JSON file
async function fetchTravelData() {
    try {
        const response = await fetch('travel_recommendation_api.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        travelData = await response.json();
        console.log('Travel data loaded:', travelData);
        return travelData;
    } catch (error) {
        console.error('Error fetching travel data:', error);
        return null;
    }
}

// Normalize search keyword
function normalizeKeyword(keyword) {
    const normalized = keyword.toLowerCase().trim();
    
    // Map of keyword variations
    const keywordMap = {
        'beach': 'beaches',
        'beaches': 'beaches',
        'playa': 'beaches',
        'playas': 'beaches',
        'temple': 'temples',
        'temples': 'temples',
        'templo': 'temples',
        'templos': 'temples',
        'country': 'countries',
        'countries': 'countries',
        'pais': 'countries',
        'paises': 'countries',
        'país': 'countries',
        'países': 'countries'
    };
    
    return keywordMap[normalized] || normalized;
}

// Get timezone for country
function getCountryTimezone(countryName) {
    const timezones = {
        'Australia': 'Australia/Sydney',
        'Japan': 'Asia/Tokyo',
        'Brazil': 'America/Sao_Paulo',
        'Cambodia': 'Asia/Phnom_Penh',
        'India': 'Asia/Kolkata',
        'French Polynesia': 'Pacific/Tahiti'
    };
    
    return timezones[countryName] || 'UTC';
}

// Get current time for timezone
function getCurrentTime(timezone) {
    const options = { 
        timeZone: timezone, 
        hour12: true, 
        hour: 'numeric', 
        minute: 'numeric', 
        second: 'numeric',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    try {
        const currentTime = new Date().toLocaleTimeString('en-US', options);
        return currentTime;
    } catch (error) {
        console.error('Error getting time:', error);
        return null;
    }
}

// Create result card HTML
function createResultCard(item, type) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    let timeInfo = '';
    
    // Add time information for countries
    if (type === 'countries') {
        const countryName = item.name;
        const timezone = getCountryTimezone(countryName);
        const currentTime = getCurrentTime(timezone);
        
        if (currentTime) {
            timeInfo = `<div class="result-time">⏰ Local time: ${currentTime}</div>`;
        }
    }
    
    // For countries, show cities
    if (type === 'countries' && item.cities) {
        let citiesHTML = '';
        item.cities.forEach(city => {
            citiesHTML += `
                <div class="city-card">
                    <img src="${city.imageUrl}" alt="${city.name}" class="result-image">
                    <div class="result-content">
                        <h3 class="result-title">${city.name}</h3>
                        <p class="result-description">${city.description}</p>
                        <button class="btn btn-visit">Visit</button>
                    </div>
                </div>
            `;
        });
        
        card.innerHTML = `
            <h2 class="country-name">${item.name}</h2>
            ${timeInfo}
            <div class="cities-container">
                ${citiesHTML}
            </div>
        `;
    } else {
        // For beaches and temples
        card.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name}" class="result-image">
            <div class="result-content">
                <h3 class="result-title">${item.name}</h3>
                <p class="result-description">${item.description}</p>
                ${timeInfo}
                <button class="btn btn-visit">Visit</button>
            </div>
        `;
    }
    
    return card;
}

// Display search results
function displayResults(results, type) {
    searchResults.innerHTML = '';
    
    if (!results || results.length === 0) {
        searchResults.innerHTML = '<p class="no-results">No recommendations found. Please try another keyword.</p>';
        searchResults.style.display = 'block';
        return;
    }
    
    results.forEach(item => {
        const card = createResultCard(item, type);
        searchResults.appendChild(card);
    });
    
    searchResults.style.display = 'block';
    
    // Smooth scroll to results
    searchResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Perform search
function performSearch() {
    const keyword = searchInput.value;
    
    if (!keyword) {
        alert('Please enter a valid search query.');
        return;
    }
    
    if (!travelData) {
        console.error('Travel data not loaded');
        alert('Data is still loading. Please try again.');
        return;
    }
    
    const normalizedKeyword = normalizeKeyword(keyword);
    console.log('Searching for:', normalizedKeyword);
    
    let results = [];
    let type = '';
    
    // Search based on normalized keyword
    switch (normalizedKeyword) {
        case 'beaches':
            results = travelData.beaches || [];
            type = 'beaches';
            break;
        case 'temples':
            results = travelData.temples || [];
            type = 'temples';
            break;
        case 'countries':
            results = travelData.countries || [];
            type = 'countries';
            break;
        default:
            // Try to find in country names or city names
            const searchLower = keyword.toLowerCase();
            
            // Search in countries
            if (travelData.countries) {
                const countryResults = travelData.countries.filter(country => 
                    country.name.toLowerCase().includes(searchLower)
                );
                if (countryResults.length > 0) {
                    results = countryResults;
                    type = 'countries';
                    break;
                }
                
                // Search in cities
                const cityResults = travelData.countries.filter(country => 
                    country.cities && country.cities.some(city => 
                        city.name.toLowerCase().includes(searchLower)
                    )
                );
                if (cityResults.length > 0) {
                    results = cityResults;
                    type = 'countries';
                    break;
                }
            }
            
            // Search in beaches
            if (travelData.beaches) {
                const beachResults = travelData.beaches.filter(beach =>
                    beach.name.toLowerCase().includes(searchLower)
                );
                if (beachResults.length > 0) {
                    results = beachResults;
                    type = 'beaches';
                    break;
                }
            }
            
            // Search in temples
            if (travelData.temples) {
                const templeResults = travelData.temples.filter(temple =>
                    temple.name.toLowerCase().includes(searchLower)
                );
                if (templeResults.length > 0) {
                    results = templeResults;
                    type = 'temples';
                    break;
                }
            }
    }
    
    console.log('Results found:', results);
    displayResults(results, type);
}

// Clear search results
function clearSearch() {
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchResults.style.display = 'none';
    console.log('Search cleared');
}

// Handle contact form submission
function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    console.log('Form submitted:', { name, email, message });
    
    alert('Thank you for your message! We will get back to you soon.');
    
    // Reset form
    contactForm.reset();
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Event listeners
searchBtn.addEventListener('click', performSearch);
clearBtn.addEventListener('click', clearSearch);

// Allow Enter key to trigger search
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Contact form submission
if (contactForm) {
    contactForm.addEventListener('submit', handleContactFormSubmit);
}

// Fetch data when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, fetching travel data...');
    fetchTravelData();
});
