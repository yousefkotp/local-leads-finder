// Local Leads Finder - Web Application
// Main JavaScript application

// State
let currentSearchId = null;
let progressInterval = null;
let allResults = [];
let currentPage = 1;
let pageSize = 25;
let currentEnrichState = true; // Track enrichment state

// Country options (ISO 3166-1 alpha-2 codes)
const COUNTRY_OPTIONS = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AS', name: 'American Samoa' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AI', name: 'Anguilla' },
    { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AW', name: 'Aruba' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BM', name: 'Bermuda' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BR', name: 'Brazil' },
    { code: 'BN', name: 'Brunei' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' },
    { code: 'CV', name: 'Cape Verde' },
    { code: 'KY', name: 'Cayman Islands' },
    { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'KM', name: 'Comoros' },
    { code: 'CG', name: 'Congo' },
    { code: 'CD', name: 'Congo (DRC)' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'CI', name: "Cote d'Ivoire" },
    { code: 'HR', name: 'Croatia' },
    { code: 'CU', name: 'Cuba' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czechia' },
    { code: 'DK', name: 'Denmark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'EE', name: 'Estonia' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'GF', name: 'French Guiana' },
    { code: 'PF', name: 'French Polynesia' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GI', name: 'Gibraltar' },
    { code: 'GR', name: 'Greece' },
    { code: 'GL', name: 'Greenland' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GP', name: 'Guadeloupe' },
    { code: 'GU', name: 'Guam' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GG', name: 'Guernsey' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IM', name: 'Isle of Man' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JE', name: 'Jersey' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'KR', name: 'Korea (South)' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kyrgyzstan' },
    { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libya' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MO', name: 'Macau' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malta' },
    { code: 'MH', name: 'Marshall Islands' },
    { code: 'MQ', name: 'Martinique' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'MX', name: 'Mexico' },
    { code: 'FM', name: 'Micronesia' },
    { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolia' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MS', name: 'Montserrat' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NC', name: 'New Caledonia' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'MP', name: 'Northern Mariana Islands' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palau' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papua New Guinea' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'PR', name: 'Puerto Rico' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'LC', name: 'Saint Lucia' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', name: 'Samoa' },
    { code: 'SM', name: 'San Marino' },
    { code: 'ST', name: 'Sao Tome and Principe' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SY', name: 'Syria' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TJ', name: 'Tajikistan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' },
    { code: 'TG', name: 'Togo' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TR', name: 'Turkiye' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'TC', name: 'Turks and Caicos Islands' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vatican City' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'VI', name: 'Virgin Islands (U.S.)' },
    { code: 'EH', name: 'Western Sahara' },
    { code: 'YE', name: 'Yemen' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' }
];

const REVEAL_SECTION_IDS = ['features', 'use-cases', 'insights'];

// Map state
let map = null;
let marker = null;
let radiusCircle = null;
let selectedLocation = null;

// DOM Elements
const searchForm = document.getElementById('searchForm');
const searchBtn = document.getElementById('searchBtn');
const progressCard = document.getElementById('progressCard');
const resultsCard = document.getElementById('resultsCard');

// Progress elements
const progressFill = document.getElementById('progressFill');
const progressPercentage = document.getElementById('progressPercentage');
const progressMessage = document.getElementById('progressMessage');
const statusValue = document.getElementById('statusValue');
const foundValue = document.getElementById('foundValue');
const uniqueValue = document.getElementById('uniqueValue');

// Results elements
const resultsCount = document.getElementById('resultsCount');
const resultsBody = document.getElementById('resultsBody');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');

// Pagination elements
const pageSizeSelect = document.getElementById('pageSize');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const currentPageSpan = document.getElementById('currentPage');
const totalPagesSpan = document.getElementById('totalPages');
const pageStartSpan = document.getElementById('pageStart');
const pageEndSpan = document.getElementById('pageEnd');
const totalResultsSpan = document.getElementById('totalResults');

// API Base URL
const API_BASE = '';

// Credentials Management
const CREDENTIALS_KEY = 'decodo_credentials';
const CREDENTIALS_EXPIRY_DAYS = 30;

function getCredentials() {
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    if (!stored) return null;

    try {
        const credentials = JSON.parse(stored);
        const expiryDate = new Date(credentials.expiry);

        // Check if expired
        if (new Date() > expiryDate) {
            localStorage.removeItem(CREDENTIALS_KEY);
            return null;
        }

        return credentials;
    } catch (e) {
        localStorage.removeItem(CREDENTIALS_KEY);
        return null;
    }
}

function saveCredentials(username, password) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + CREDENTIALS_EXPIRY_DAYS);

    const credentials = {
        username: username,
        password: password,
        expiry: expiry.toISOString()
    };

    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

function checkCredentials() {
    const credentials = getCredentials();
    if (!credentials) {
        showCredentialsModal();
        return false;
    }
    return true;
}

function showCredentialsModal() {
    const modal = document.getElementById('credentialsModal');
    modal.style.display = 'flex';
}

function hideCredentialsModal() {
    const modal = document.getElementById('credentialsModal');
    modal.style.display = 'none';
}

// Tutorial Management
let currentTutorialStep = 1;

function showTutorial() {
    document.getElementById('credentialsForm').style.display = 'none';
    document.getElementById('tutorialSteps').style.display = 'block';
    currentTutorialStep = 1;
    updateTutorialStep();
}

function hideTutorial() {
    document.getElementById('credentialsForm').style.display = 'block';
    document.getElementById('tutorialSteps').style.display = 'none';
}

function updateTutorialStep() {
    // Hide all steps
    for (let i = 1; i <= 6; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) step.style.display = 'none';
    }

    // Show current step
    const currentStep = document.getElementById(`step${currentTutorialStep}`);
    if (currentStep) currentStep.style.display = 'block';

    // Update dots
    const dots = document.querySelectorAll('.tutorial-dots .dot');
    dots.forEach((dot, index) => {
        if (index === currentTutorialStep - 1) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });

    // Update buttons
    const prevBtn = document.getElementById('tutorialPrevBtn');
    const nextBtn = document.getElementById('tutorialNextBtn');

    prevBtn.disabled = currentTutorialStep === 1;

    if (currentTutorialStep === 6) {
        nextBtn.textContent = 'Got it!';
    } else {
        nextBtn.innerHTML = `Next <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    }
}

function nextTutorialStep() {
    if (currentTutorialStep < 6) {
        currentTutorialStep++;
        updateTutorialStep();
    } else {
        hideTutorial();
    }
}

function prevTutorialStep() {
    if (currentTutorialStep > 1) {
        currentTutorialStep--;
        updateTutorialStep();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupCredentialsListeners();
    initializeMap();
    setupLocationModeToggle();
    setupRadiusSlider();
    populateCountrySelect();
    initializeSectionReveal();
});

// Setup Event Listeners
function setupEventListeners() {
    searchForm.addEventListener('submit', handleSearch);
    exportCsvBtn.addEventListener('click', () => exportResults('csv'));
    exportJsonBtn.addEventListener('click', () => exportResults('json'));

    // Pagination
    pageSizeSelect.addEventListener('change', handlePageSizeChange);
    prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
}

// Setup Credentials Modal Listeners
function setupCredentialsListeners() {
    const saveBtn = document.getElementById('saveCredentialsBtn');
    const showTutorialBtn = document.getElementById('showTutorialBtn');
    const backToFormBtn = document.getElementById('backToFormBtn');
    const tutorialPrevBtn = document.getElementById('tutorialPrevBtn');
    const tutorialNextBtn = document.getElementById('tutorialNextBtn');
    const ctaTutorialLink = document.getElementById('ctaTutorialLink');
    const closeModalBtn = document.getElementById('closeCredentialsModal');

    saveBtn.addEventListener('click', () => {
        const username = document.getElementById('decodUsername').value.trim();
        const password = document.getElementById('decodPassword').value.trim();

        if (!username || !password) {
            alert('Please enter both username and password');
            return;
        }

        saveCredentials(username, password);
        hideCredentialsModal();

        // Clear inputs
        document.getElementById('decodUsername').value = '';
        document.getElementById('decodPassword').value = '';
    });

    if (ctaTutorialLink) {
        ctaTutorialLink.addEventListener('click', (event) => {
            event.preventDefault();
            showCredentialsModal();
            showTutorial();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            hideTutorial();
            hideCredentialsModal();
        });
    }

    showTutorialBtn.addEventListener('click', showTutorial);
    backToFormBtn.addEventListener('click', hideTutorial);
    tutorialPrevBtn.addEventListener('click', prevTutorialStep);
    tutorialNextBtn.addEventListener('click', nextTutorialStep);
}

// Initialize Leaflet Map
function initializeMap() {
    // Default location (Toronto)
    const defaultLat = 43.6532;
    const defaultLng = -79.3832;

    // Create map without attribution control
    map = L.map('map', {
        attributionControl: false
    }).setView([defaultLat, defaultLng], 11);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 3
    }).addTo(map);

    // Handle map clicks
    map.on('click', function(e) {
        setLocation(e.latlng.lat, e.latlng.lng);
    });

    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 13);
                setLocation(lat, lng);
            },
            function(error) {
                console.log('Geolocation error:', error);
                // Set default location if geolocation fails
                setLocation(defaultLat, defaultLng);
            }
        );
    } else {
        // Set default location if geolocation not supported
        setLocation(defaultLat, defaultLng);
    }
}

// Set Location on Map
function setLocation(lat, lng) {
    selectedLocation = { lat, lng };

    // Update hidden form inputs
    document.getElementById('latitude').value = lat.toFixed(6);
    document.getElementById('longitude').value = lng.toFixed(6);

    // Remove existing marker if any
    if (marker) {
        map.removeLayer(marker);
    }

    // Add new marker
    marker = L.marker([lat, lng], {
        draggable: true,
        title: 'Search Location'
    }).addTo(map);

    // Handle marker drag
    marker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        setLocation(pos.lat, pos.lng);
    });

    // Update radius circle
    updateRadiusCircle();

    // Hide map instructions after first location set
    const instructions = document.querySelector('.map-instructions');
    if (instructions) {
        instructions.style.opacity = '0';
        setTimeout(() => {
            instructions.style.display = 'none';
        }, 300);
    }
}

// Update Radius Circle on Map
function updateRadiusCircle() {
    if (!selectedLocation) return;

    const radiusInput = document.getElementById('radius');
    const radius = parseFloat(radiusInput.value);

    // Remove existing circle if any
    if (radiusCircle) {
        map.removeLayer(radiusCircle);
    }

    // Add new circle
    radiusCircle = L.circle([selectedLocation.lat, selectedLocation.lng], {
        radius: radius * 1000, // Convert km to meters
        color: '#4F46E5',
        fillColor: '#4F46E5',
        fillOpacity: 0.1,
        weight: 2
    }).addTo(map);

    // Fit map to circle bounds
    map.fitBounds(radiusCircle.getBounds(), {
        padding: [50, 50],
        maxZoom: 15
    });
}

// Setup Location Mode Toggle
function setupLocationModeToggle() {
    const locationModeInputs = document.querySelectorAll('input[name="locationMode"]');
    const mapModeSection = document.getElementById('mapModeSection');
    const cityModeSection = document.getElementById('cityModeSection');

    locationModeInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'map') {
                // Show map mode
                mapModeSection.style.display = 'block';
                cityModeSection.style.display = 'none';

                // Invalidate map size (Leaflet needs this after visibility change)
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            } else {
                // Show city mode
                mapModeSection.style.display = 'none';
                cityModeSection.style.display = 'block';
            }
        });
    });
}

// Setup Radius Slider
function setupRadiusSlider() {
    const radiusInput = document.getElementById('radius');
    const radiusValue = document.getElementById('radiusValue');

    radiusInput.addEventListener('input', function() {
        const value = parseFloat(this.value).toFixed(1);
        radiusValue.textContent = value;
        updateRadiusCircle();
    });
}

// Handle Search Form Submit
async function handleSearch(e) {
    e.preventDefault();

    // Check credentials first
    if (!checkCredentials()) {
        return; // Modal will be shown automatically
    }

    // Get credentials
    const credentials = getCredentials();

    // Get form data
    const formData = new FormData(searchForm);

    // Determine which mode is active
    const locationMode = document.querySelector('input[name="locationMode"]:checked').value;

    // Store enrichment state
    currentEnrichState = document.getElementById('enrich').checked;

    const data = {
        query: formData.get('query'),
        limit: parseInt(formData.get('limit')),
        enrich: currentEnrichState
    };

    // Add location-specific or city-specific fields
    if (locationMode === 'map') {
        // Location mode
        const latitude = document.getElementById('latitude').value;
        const longitude = document.getElementById('longitude').value;
        const radius = document.getElementById('radius').value;

        if (!latitude || !longitude) {
            showError('Please select a location on the map');
            return;
        }

        data.latitude = parseFloat(latitude);
        data.longitude = parseFloat(longitude);
        data.radius_km = parseFloat(radius);
        data.city = ''; // Empty city for location mode
    } else {
        // City mode
        data.city = formData.get('city');
        data.country = formData.get('country') || null;
    }

    // Validate
    if (!data.query) {
        showError('Please enter a business type');
        return;
    }

    if (locationMode === 'city' && !data.city) {
        showError('Please enter a city');
        return;
    }

    if (data.limit < 1 || data.limit > 1000) {
        showError('Limit must be between 1 and 1000');
        return;
    }

    // Disable form
    disableForm();

    // Hide results, show progress
    resultsCard.style.display = 'none';
    progressCard.style.display = 'block';
    resetProgress();

    try {
        // Start search
        const response = await fetch(`${API_BASE}/api/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Decodo-Username': credentials.username,
                'X-Decodo-Password': credentials.password
            },
            body: JSON.stringify(data)
        });

        // Check if response is OK
        if (!response.ok) {
            let errorMessage = 'Failed to start search';

            // Try to parse error as JSON
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (jsonError) {
                // If JSON parsing fails, try to get text
                try {
                    const text = await response.text();
                    if (text.includes('<')) {
                        errorMessage = 'Server returned an HTML error page. Please check server logs.';
                    } else {
                        errorMessage = text || errorMessage;
                    }
                } catch (textError) {
                    // If all else fails, use status text
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
            }

            throw new Error(errorMessage);
        }

        // Parse successful response
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            throw new Error('Invalid response from server. Expected JSON but got something else.');
        }

        currentSearchId = result.search_id;

        // Start polling for progress
        startProgressPolling();

    } catch (error) {
        console.error('Search error:', error);
        showError(error.message);
        enableForm();
        progressCard.style.display = 'none';
    }
}

// Start Progress Polling
function startProgressPolling() {
    // Clear any existing interval
    if (progressInterval) {
        clearInterval(progressInterval);
    }

    // Poll every 500ms
    progressInterval = setInterval(async () => {
        try {
            await checkProgress();
        } catch (error) {
            console.error('Progress check error:', error);
            stopProgressPolling();
            showError('Failed to check progress');
            enableForm();
        }
    }, 500);
}

// Stop Progress Polling
function stopProgressPolling() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// Check Progress
async function checkProgress() {
    if (!currentSearchId) return;

    const response = await fetch(`${API_BASE}/api/search/${currentSearchId}/progress`);

    if (!response.ok) {
        throw new Error('Failed to fetch progress');
    }

    let progress;
    try {
        progress = await response.json();
    } catch (jsonError) {
        throw new Error('Invalid progress response from server');
    }

    // Update progress UI
    updateProgress(progress);

    // Check if completed
    if (progress.completed) {
        stopProgressPolling();

        if (progress.error) {
            showError(progress.error);
            enableForm();
            progressCard.style.display = 'none';
        } else {
            // Load results
            await loadResults();
            enableForm();
        }
    }
}

// Update Progress UI
function updateProgress(progress) {
    // Update progress bar
    progressFill.style.width = `${progress.progress}%`;
    progressPercentage.textContent = `${progress.progress}%`;

    // Update message
    progressMessage.textContent = progress.message;

    // Update stats
    statusValue.textContent = formatStatus(progress.status);
    foundValue.textContent = progress.total_found || 0;
    uniqueValue.textContent = progress.unique_count || 0;
}

// Reset Progress
function resetProgress() {
    progressFill.style.width = '0%';
    progressPercentage.textContent = '0%';
    progressMessage.textContent = 'Initializing search...';
    statusValue.textContent = 'Starting';
    foundValue.textContent = '0';
    uniqueValue.textContent = '0';
}

// Load Results
async function loadResults() {
    if (!currentSearchId) return;

    try {
        const response = await fetch(`${API_BASE}/api/search/${currentSearchId}/results`);

        if (!response.ok) {
            throw new Error('Failed to load results');
        }

        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error('Invalid results response from server');
        }

        displayResults(data.results, currentEnrichState);

        // Show results card, hide progress
        progressCard.style.display = 'none';
        resultsCard.style.display = 'block';

    } catch (error) {
        console.error('Results loading error:', error);
        showError('Failed to load results');
    }
}

// Display Results
function displayResults(results, enrichEnabled) {
    // Store all results
    allResults = results;
    currentPage = 1;

    // Update total count
    resultsCount.textContent = results.length;

    // Show/hide columns based on enrichment
    updateTableColumns(enrichEnabled);

    // Render first page
    renderPage();
}

// Update Table Columns Based on Enrichment
function updateTableColumns(enrichEnabled) {
    const table = document.getElementById('resultsTable');
    const headers = table.querySelectorAll('thead th');
    const emailIndex = 5; // Email column (0-indexed)
    const websiteIndex = 6; // Website column (0-indexed)

    if (enrichEnabled) {
        // Show email and website columns
        if (headers[emailIndex]) headers[emailIndex].style.display = '';
        if (headers[websiteIndex]) headers[websiteIndex].style.display = '';
    } else {
        // Hide email and website columns
        if (headers[emailIndex]) headers[emailIndex].style.display = 'none';
        if (headers[websiteIndex]) headers[websiteIndex].style.display = 'none';
    }
}

// Render Current Page
function renderPage() {
    // Clear existing rows
    resultsBody.innerHTML = '';

    if (allResults.length === 0) {
        resultsBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No results found</td></tr>';
        updatePaginationControls();
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, allResults.length);
    const pageResults = allResults.slice(startIndex, endIndex);

    // Add rows
    pageResults.forEach((business, index) => {
        const row = createResultRow(business, startIndex + index);
        resultsBody.appendChild(row);
    });

    // Update pagination controls
    updatePaginationControls();
}

// Update Pagination Controls
function updatePaginationControls() {
    const totalPages = Math.ceil(allResults.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, allResults.length);

    // Update text
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages || 1;
    pageStartSpan.textContent = allResults.length > 0 ? startIndex : 0;
    pageEndSpan.textContent = endIndex;
    totalResultsSpan.textContent = allResults.length;

    // Update button states
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// Change Page
function changePage(newPage) {
    const totalPages = Math.ceil(allResults.length / pageSize);

    if (newPage < 1 || newPage > totalPages) {
        return;
    }

    currentPage = newPage;
    renderPage();

    // Scroll to top of results
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Handle Page Size Change
function handlePageSizeChange() {
    pageSize = parseInt(pageSizeSelect.value);
    currentPage = 1;
    renderPage();
}

// Create Result Row
function createResultRow(business, index) {
    const row = document.createElement('tr');
    row.className = 'fade-in';
    row.style.animationDelay = `${Math.min((index % pageSize) * 0.02, 0.5)}s`;

    // Name
    const nameCell = document.createElement('td');
    nameCell.innerHTML = `<strong>${escapeHtml(business.name || 'N/A')}</strong>`;
    row.appendChild(nameCell);

    // Category
    const categoryCell = document.createElement('td');
    if (business.category) {
        categoryCell.innerHTML = `<span class="badge">${escapeHtml(business.category)}</span>`;
    } else {
        categoryCell.textContent = '-';
    }
    row.appendChild(categoryCell);

    // Rating
    const ratingCell = document.createElement('td');
    if (business.rating) {
        ratingCell.innerHTML = `<span class="rating">${business.rating.toFixed(1)}</span>`;
    } else {
        ratingCell.textContent = '-';
    }
    row.appendChild(ratingCell);

    // Reviews
    const reviewsCell = document.createElement('td');
    reviewsCell.textContent = business.reviews_count ? formatNumber(business.reviews_count) : '-';
    row.appendChild(reviewsCell);

    // Phone
    const phoneCell = document.createElement('td');
    if (business.phone) {
        phoneCell.innerHTML = `<a href="tel:${escapeHtml(business.phone)}" class="link">${escapeHtml(business.phone)}</a>`;
    } else {
        phoneCell.textContent = '-';
    }
    row.appendChild(phoneCell);

    // Email
    const emailCell = document.createElement('td');
    if (business.email) {
        emailCell.innerHTML = `<a href="mailto:${escapeHtml(business.email)}" class="link">${escapeHtml(business.email)}</a>`;
    } else {
        emailCell.textContent = '-';
    }
    // Hide if enrichment is disabled
    if (!currentEnrichState) {
        emailCell.style.display = 'none';
    }
    row.appendChild(emailCell);

    // Website
    const websiteCell = document.createElement('td');
    if (business.website) {
        websiteCell.innerHTML = `<a href="${escapeHtml(business.website)}" target="_blank" rel="noopener" class="link">Visit</a>`;
    } else {
        websiteCell.textContent = '-';
    }
    // Hide if enrichment is disabled
    if (!currentEnrichState) {
        websiteCell.style.display = 'none';
    }
    row.appendChild(websiteCell);

    // Google Maps
    const mapsCell = document.createElement('td');
    if (business.google_maps_url) {
        mapsCell.innerHTML = `<a href="${escapeHtml(business.google_maps_url)}" target="_blank" rel="noopener" class="link">Maps</a>`;
    } else {
        mapsCell.textContent = '-';
    }
    row.appendChild(mapsCell);

    // Address
    const addressCell = document.createElement('td');
    addressCell.textContent = business.address || '-';
    addressCell.style.maxWidth = '250px';
    addressCell.style.whiteSpace = 'nowrap';
    addressCell.style.overflow = 'hidden';
    addressCell.style.textOverflow = 'ellipsis';
    addressCell.title = business.address || '';
    row.appendChild(addressCell);

    return row;
}

// Export Results
async function exportResults(format) {
    if (!currentSearchId) return;

    try {
        // Open download in new window
        window.open(`${API_BASE}/api/search/${currentSearchId}/export/${format}`, '_blank');
    } catch (error) {
        console.error('Export error:', error);
        showError('Failed to export results');
    }
}

// Disable Form
function disableForm() {
    searchBtn.disabled = true;
    searchBtn.innerHTML = `
        <span class="spinner"></span>
        Searching...
    `;

    // Disable all inputs
    const inputs = searchForm.querySelectorAll('input, select, input[type="checkbox"]');
    inputs.forEach(input => input.disabled = true);
}

// Enable Form
function enableForm() {
    searchBtn.disabled = false;
    searchBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19 19L14.65 14.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Search for Leads
    `;

    // Enable all inputs
    const inputs = searchForm.querySelectorAll('input, select, input[type="checkbox"]');
    inputs.forEach(input => input.disabled = false);
}

// Show Error
function showError(message) {
    let text = message || 'An unexpected error occurred.';
    const authPrefix = 'AUTH_REQUIRED::';

    if (typeof text === 'string' && text.startsWith(authPrefix)) {
        text = text.slice(authPrefix.length).trim();
        localStorage.removeItem(CREDENTIALS_KEY);
        showCredentialsModal();
        alert(`Authentication Error: ${text}`);
        return;
    }

    alert(`Error: ${text}`);
}

// Format Status
function formatStatus(status) {
    const statusMap = {
        'initializing': 'Initializing',
        'connecting': 'Connecting',
        'searching': 'Searching',
        'processing': 'Processing',
        'completed': 'Completed',
        'error': 'Error'
    };

    return statusMap[status] || status;
}

// Format Number
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle visibility change (pause polling when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (progressInterval) {
            stopProgressPolling();
        }
    } else {
        if (currentSearchId && !progressInterval) {
            startProgressPolling();
        }
    }
});
function populateCountrySelect() {
    const countrySelect = document.getElementById('country');
    if (!countrySelect) {
        return;
    }

    countrySelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Auto-detect';
    countrySelect.appendChild(defaultOption);

    COUNTRY_OPTIONS.forEach(({ code, name }) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = `${name} (${code})`;
        countrySelect.appendChild(option);
    });
}

function initializeSectionReveal() {
    const revealIds = new Set(REVEAL_SECTION_IDS);
    const navLinks = document.querySelectorAll('.primary-nav a[href^="#"]');

    revealIds.forEach(id => {
        const section = document.getElementById(id);
        if (section && section.dataset.revealed !== 'true') {
            section.classList.add('is-hidden');
            section.dataset.revealed = 'false';
            section.setAttribute('aria-hidden', 'true');
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href') || '';
            const targetId = href.replace('#', '');
            if (!targetId) {
                return;
            }

            const section = document.getElementById(targetId);
            if (section && revealIds.has(targetId)) {
                event.preventDefault();
                revealSection(section);
                const newHash = `#${targetId}`;
                if (window.location.hash !== newHash) {
                    history.replaceState(null, '', newHash);
                }
                requestAnimationFrame(() => {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }
        });
    });

    const initialHash = (window.location.hash || '').replace('#', '');
    if (revealIds.has(initialHash)) {
        const initialSection = document.getElementById(initialHash);
        if (initialSection) {
            revealSection(initialSection);
            requestAnimationFrame(() => {
                initialSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    window.addEventListener('hashchange', () => {
        const targetId = (window.location.hash || '').replace('#', '');
        if (!revealIds.has(targetId)) {
            return;
        }
        const section = document.getElementById(targetId);
        if (section) {
            revealSection(section);
            requestAnimationFrame(() => {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    });
}

function revealSection(section) {
    if (!section || section.dataset.revealed === 'true') {
        return;
    }
    section.classList.remove('is-hidden');
    section.dataset.revealed = 'true';
    section.removeAttribute('aria-hidden');
}
