// Local Leads Finder - Web Application
// Main JavaScript application

// State
let currentSearchId = null;
let progressInterval = null;
let allResults = [];
let currentPage = 1;
let pageSize = 25;

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
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

// Handle Search Form Submit
async function handleSearch(e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(searchForm);
    const data = {
        query: formData.get('query'),
        city: formData.get('city'),
        limit: parseInt(formData.get('limit')),
        country: formData.get('country') || null,
        enrich: document.getElementById('enrich').checked
    };

    // Validate
    if (!data.query || !data.city) {
        showError('Please fill in all required fields');
        return;
    }

    if (data.limit < 1 || data.limit > 500) {
        showError('Limit must be between 1 and 500');
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
                'Content-Type': 'application/json'
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

        displayResults(data.results);

        // Show results card, hide progress
        progressCard.style.display = 'none';
        resultsCard.style.display = 'block';

    } catch (error) {
        console.error('Results loading error:', error);
        showError('Failed to load results');
    }
}

// Display Results
function displayResults(results) {
    // Store all results
    allResults = results;
    currentPage = 1;

    // Update total count
    resultsCount.textContent = results.length;

    // Render first page
    renderPage();
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
    row.appendChild(emailCell);

    // Website
    const websiteCell = document.createElement('td');
    if (business.website) {
        websiteCell.innerHTML = `<a href="${escapeHtml(business.website)}" target="_blank" rel="noopener" class="link">Visit</a>`;
    } else {
        websiteCell.textContent = '-';
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
    alert(`Error: ${message}`);
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
