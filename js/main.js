// Main JavaScript functionality for Belgian Air Force MILSIM website
// Based on AF.mil design patterns and best practices

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeNavigation();
    initializeSearch();
    initializeHeroCarousel();
    highlightCurrentPage();
    initializeSmoothScroll();
    initializeKeyboardNavigation();
    initializeScrollAnimations();
    initializeHeaderScroll();
    initializeSocialSharing();
    
    // Initialize operational statistics fetching
    initializeOperationalStats();
    
    // Log page interaction for MILSIM tracking
    logPageInteraction('page_load', {
        page: window.location.pathname,
        timestamp: new Date().toISOString()
    });
});

// ===== NAVIGATION =====
function initializeNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMain = document.getElementById('nav-main');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile hamburger menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navToggle.classList.toggle('active');
            navMain.classList.toggle('active');
            
            // Show mobile footer when menu is open
            const mobileFooter = document.querySelector('.nav-mobile-footer');
            if (mobileFooter) {
                mobileFooter.classList.toggle('active');
            }
            
            // Update accessibility attribute
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
        });
    }

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navToggle && navToggle.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMain.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                
                const mobileFooter = document.querySelector('.nav-mobile-footer');
                if (mobileFooter) {
                    mobileFooter.classList.remove('active');
                }
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const header = document.getElementById('header-main');
        if (header && !header.contains(event.target)) {
            if (navToggle && navToggle.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMain.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                
                const mobileFooter = document.querySelector('.nav-mobile-footer');
                if (mobileFooter) {
                    mobileFooter.classList.remove('active');
                }
            }
        }
    });
}

// ===== SEARCH FUNCTIONALITY =====
function initializeSearch() {
    const searchToggle = document.querySelector('.search-toggle');
    const searchPanel = document.querySelector('.search-panel');
    const searchInput = document.querySelector('.search-input');
    const searchSubmit = document.querySelector('.search-submit');

    if (!searchToggle || !searchPanel) return;

    // Toggle search panel
    searchToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        searchPanel.classList.toggle('active');
        
        if (searchPanel.classList.contains('active') && searchInput) {
            searchInput.focus();
        }
    });

    // Handle search submission
    if (searchSubmit) {
        searchSubmit.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
                searchPanel.classList.remove('active');
                searchInput.value = '';
            }
        });
    }

    // Handle Enter key in search input
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    performSearch(query);
                    searchPanel.classList.remove('active');
                    this.value = '';
                }
            }
        });
    }

    // Close search panel when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.search-container')) {
            searchPanel.classList.remove('active');
        }
    });
}

function performSearch(query) {
    // Log search action
    logPageInteraction('search', {
        query: query,
        timestamp: new Date().toISOString()
    });
    
    console.log('Searching for:', query);
    
    // Search through page content
    const results = searchContent(query);
    
    if (results.length > 0) {
        displaySearchResults(query, results);
    } else {
        alert(`No results found for "${query}". Try searching for: pilot, operations, careers, benefits, etc.`);
    }
}

function searchContent(query) {
    const results = [];
    const queryLower = query.toLowerCase().trim();
    
    if (queryLower.length === 0) return results;
    
    // Define keyword relationships for semantic search
    const keywordRelationships = {
        'pilot': ['aviation', 'fly', 'aircraft', 'airmen', 'officer', 'training', 'cockpit', 'mission'],
        'career': ['job', 'position', 'opportunity', 'employment', 'profession', 'role', 'path'],
        'operation': ['mission', 'command', 'deploy', 'active', 'strategic', 'global', 'combat'],
        'training': ['education', 'learn', 'qualify', 'certification', 'course', 'program', 'academy'],
        'benefit': ['pay', 'health', 'retirement', 'insurance', 'compensation', 'package', 'advantage'],
        'military': ['armed', 'service', 'defense', 'national', 'force', 'strategy', 'combat'],
        'technology': ['system', 'equipment', 'advanced', 'digital', 'cyber', 'innovation', 'software'],
        'leadership': ['command', 'officer', 'senior', 'management', 'direction', 'authority', 'team'],
        'security': ['protect', 'defense', 'classified', 'clearance', 'intelligence', 'safety', 'secure'],
        'fly': ['pilot', 'aircraft', 'aviation', 'mission', 'airmen', 'wing'],
        'deploy': ['operation', 'mission', 'global', 'command', 'strategic', 'overseas'],
        'officer': ['pilot', 'leadership', 'command', 'rank', 'military', 'commission'],
        'enlisted': ['rank', 'service', 'military', 'crew', 'specialty', 'soldier']
    };
    
    // Get related keywords for the query
    function getRelatedKeywords(q) {
        const keywords = [q];
        
        // Add exact relationships
        if (keywordRelationships[q]) {
            keywords.push(...keywordRelationships[q]);
        }
        
        // Add reverse relationships
        Object.keys(keywordRelationships).forEach(key => {
            if (keywordRelationships[key].includes(q) && !keywords.includes(key)) {
                keywords.push(key);
            }
        });
        
        // Add singular/plural variations
        if (q.endsWith('s')) {
            keywords.push(q.slice(0, -1));
        } else {
            keywords.push(q + 's');
        }
        
        return [...new Set(keywords)];
    }
    
    // Fuzzy matching: check if word partially matches
    function fuzzyMatch(word, pattern) {
        const pLower = pattern.toLowerCase();
        const wLower = word.toLowerCase();
        
        if (wLower === pLower) return true;
        if (wLower.includes(pLower) || pLower.includes(wLower)) return true;
        
        const minLength = Math.min(wLower.length, pLower.length);
        if (minLength > 2) {
            let matches = 0;
            for (let i = 0; i < minLength; i++) {
                if (wLower[i] === pLower[i]) matches++;
            }
            if (matches / minLength >= 0.7) return true;
        }
        
        return false;
    }
    
    // Check if text matches query or related keywords
    function matchesQuery(text) {
        if (!text || text.trim().length < 1) return false;
        const relatedKeywords = getRelatedKeywords(queryLower);
        const words = text.toLowerCase().split(/\s+/);
        
        for (let word of words) {
            word = word.replace(/[^\w]/g, '');
            for (let keyword of relatedKeywords) {
                if (fuzzyMatch(word, keyword)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    const searchedElements = new Set();
    
    // 1. SEARCH NAVIGATION LINKS (Page names and categories)
    document.querySelectorAll('.nav-link, .nav-item').forEach(link => {
        const text = link.textContent;
        if (matchesQuery(text) && !searchedElements.has(link)) {
            searchedElements.add(link);
            results.push({
                element: link,
                text: `[Navigation] ${text}`,
                query: query
            });
        }
    });
    
    // 2. SEARCH IMAGE ALT TEXT (Images and visual content)
    document.querySelectorAll('img').forEach(img => {
        const altText = img.getAttribute('alt') || img.getAttribute('title') || '';
        if (matchesQuery(altText) && !searchedElements.has(img)) {
            searchedElements.add(img);
            results.push({
                element: img,
                text: `[Image] ${altText || 'Image'}`,
                query: query
            });
        }
    });
    
    // 3. SEARCH PAGE TITLES AND HEADINGS (All heading levels)
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
        const text = heading.textContent;
        if (matchesQuery(text) && !searchedElements.has(heading)) {
            searchedElements.add(heading);
            results.push({
                element: heading,
                text: `[Heading] ${text}`,
                query: query
            });
        }
    });
    
    // 4. SEARCH MAIN CONTENT (All text nodes)
    const main = document.querySelector('main') || document.querySelector('.container');
    if (main) {
        const walker = document.createTreeWalker(
            main,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            const text = node.textContent;
            
            if (matchesQuery(text) && node.parentElement && !searchedElements.has(node.parentElement)) {
                const parent = node.parentElement;
                
                if (text.trim().length > 2 && !parent.classList.contains('logo-svg')) {
                    searchedElements.add(parent);
                    
                    let context = parent.closest('h2, h3, h4, h5, h6, p, article, li, div.featured-card, div.fact-card, section, div.news-article');
                    if (context) {
                        results.push({
                            element: context,
                            text: context.textContent.substring(0, 150),
                            query: query
                        });
                    }
                }
            }
        }
    }
    
    // 5. SEARCH CATEGORIES AND LABELS (Any span, label, or data-category elements)
    document.querySelectorAll('[data-category], [data-label], .category, .label, .badge').forEach(elem => {
        const text = elem.textContent;
        if (matchesQuery(text) && !searchedElements.has(elem)) {
            searchedElements.add(elem);
            results.push({
                element: elem,
                text: `[Category] ${text}`,
                query: query
            });
        }
    });
    
    // 6. SEARCH ALL LINK HREFS (Links to pages and sections)
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent;
        if ((matchesQuery(href) || matchesQuery(text)) && !searchedElements.has(link)) {
            searchedElements.add(link);
            results.push({
                element: link,
                text: `[Link] ${text || href}`,
                query: query
            });
        }
    });
    
    // Remove duplicates and limit results
    const uniqueResults = Array.from(new Map(
        results.map(r => [r.element, r])
    ).values());
    
    return uniqueResults.slice(0, 20); // Allow up to 20 results for comprehensive search
}

function displaySearchResults(query, results) {
    // Create or get results modal
    let modal = document.getElementById('search-results-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'search-results-modal';
        modal.className = 'search-results-modal';
        document.body.appendChild(modal);
    }
    
    // Build HTML for results
    let resultsHTML = `
        <div class="search-results-content">
            <button class="search-close" onclick="closeSearchResults()" aria-label="Close search results">
                <i class="fas fa-times"></i>
            </button>
            <h2>Search Results for "${query}"</h2>
            <p class="results-count">Found ${results.length} result${results.length !== 1 ? 's' : ''}</p>
            <div class="results-list">
    `;
    
    results.forEach((result, index) => {
        const text = result.text.replace(new RegExp(`(${query})`, 'gi'), '<mark>$1</mark>');
        resultsHTML += `
            <div class="result-item" onclick="scrollToResult(this)">
                <div class="result-number">${index + 1}</div>
                <div class="result-content">
                    <p>${text}...</p>
                    <button class="btn-small" onclick="scrollToResult(this)">Go to Result</button>
                </div>
            </div>
        `;
    });
    
    resultsHTML += `
            </div>
        </div>
    `;
    
    modal.innerHTML = resultsHTML;
    modal.style.display = 'flex';
    
    // Add styles if not already present
    if (!document.getElementById('search-results-styles')) {
        const styles = document.createElement('style');
        styles.id = 'search-results-styles';
        styles.textContent = `
            .search-results-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .search-results-content {
                background: white;
                border-radius: 8px;
                padding: 30px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                position: relative;
            }
            
            .search-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #999;
                transition: color 0.3s;
            }
            
            .search-close:hover {
                color: #003f7f;
            }
            
            .search-results-content h2 {
                color: #003f7f;
                margin-bottom: 10px;
                font-size: 24px;
            }
            
            .results-count {
                color: #666;
                font-size: 14px;
                margin-bottom: 20px;
            }
            
            .results-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .result-item {
                display: flex;
                gap: 15px;
                padding: 15px;
                border-left: 4px solid #0066cc;
                background-color: #f9f9f9;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .result-item:hover {
                background-color: #eff5ff;
                transform: translateX(5px);
            }
            
            .result-number {
                flex-shrink: 0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background-color: #003f7f;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
            }
            
            .result-content {
                flex: 1;
            }
            
            .result-content p {
                margin: 0 0 10px 0;
                color: #333;
                font-size: 14px;
                line-height: 1.5;
            }
            
            mark {
                background-color: #ffd700;
                padding: 0 3px;
                font-weight: 600;
            }
            
            .btn-small {
                background-color: #0066cc;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            
            .btn-small:hover {
                background-color: #003f7f;
            }
            
            @media (max-width: 768px) {
                .search-results-content {
                    width: 95%;
                    padding: 20px;
                }
                
                .result-item {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

function closeSearchResults() {
    const modal = document.getElementById('search-results-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function scrollToResult(element) {
    const modal = document.getElementById('search-results-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Close the modal after a brief delay
    setTimeout(() => {
        window.scrollTo({
            behavior: 'smooth',
            top: 0
        });
    }, 200);
}

// ===== HERO CAROUSEL =====
function initializeHeroCarousel() {
    const carousel = document.querySelector('.hero-carousel');
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    const slideCounter = document.getElementById('slide-counter');
    const totalSlides = document.getElementById('total-slides');

    if (!carousel || slides.length === 0) return;

    let currentSlide = 0;
    const slideCount = slides.length;

    if (totalSlides) {
        totalSlides.textContent = slideCount;
    }

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(ind => ind.classList.remove('active'));
        
        slides[index].classList.add('active');
        if (indicators[index]) {
            indicators[index].classList.add('active');
        }
        
        if (slideCounter) {
            slideCounter.textContent = index + 1;
        }
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slideCount;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slideCount) % slideCount;
        showSlide(currentSlide);
    }

    // Button event listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            clearInterval(carouselInterval);
            carouselInterval = setInterval(nextSlide, 5000);
            logPageInteraction('carousel_prev', { slide: currentSlide });
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            clearInterval(carouselInterval);
            carouselInterval = setInterval(nextSlide, 5000);
            logPageInteraction('carousel_next', { slide: currentSlide });
        });
    }

    // Indicator event listeners
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
            clearInterval(carouselInterval);
            carouselInterval = setInterval(nextSlide, 5000);
            logPageInteraction('carousel_indicator', { slide: currentSlide });
        });
    });

    // Auto-advance slides every 5 seconds
    let carouselInterval = setInterval(nextSlide, 5000);

    // Pause on hover
    carousel.addEventListener('mouseenter', () => clearInterval(carouselInterval));
    carousel.addEventListener('mouseleave', () => {
        carouselInterval = setInterval(nextSlide, 5000);
    });

    // Initialize first slide
    showSlide(0);

    // Log carousel interaction
    carousel.addEventListener('click', () => {
        logPageInteraction('carousel_interact', {
            slide: currentSlide,
            timestamp: new Date().toISOString()
        });
    });
}

// ===== HIGHLIGHT CURRENT PAGE =====
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        if (currentPath.includes(href) || 
            (currentPath.endsWith('/') && href === 'index.html') ||
            (currentPath.includes(href) && href !== '#')) {
            link.setAttribute('aria-current', 'page');
            link.classList.add('active');
        } else {
            link.removeAttribute('aria-current');
            link.classList.remove('active');
        }
    });
}

// ===== SMOOTH SCROLLING =====
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#') return;
            
            const target = document.querySelector(href);
            
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== KEYBOARD NAVIGATION =====
function initializeKeyboardNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach((item, index) => {
        const link = item.querySelector('.nav-link');
        
        if (link) {
            link.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextItem = navItems[index + 1];
                    if (nextItem) {
                        nextItem.querySelector('.nav-link').focus();
                    }
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevItem = navItems[index - 1];
                    if (prevItem) {
                        prevItem.querySelector('.nav-link').focus();
                    }
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    navItems[0].querySelector('.nav-link').focus();
                } else if (e.key === 'End') {
                    e.preventDefault();
                    navItems[navItems.length - 1].querySelector('.nav-link').focus();
                }
            });
        }
    });

    // Handle Escape key to close mobile menu and search
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const navToggle = document.getElementById('nav-toggle');
            const navMain = document.getElementById('nav-main');
            const searchPanel = document.querySelector('.search-panel');
            
            if (navToggle && navToggle.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMain.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.focus();
            }
            
            if (searchPanel && searchPanel.classList.contains('active')) {
                searchPanel.classList.remove('active');
            }
        }
    });
}

// ===== INTERACTION LOGGING =====
function logPageInteraction(action, data) {
    // Log interactions for MILSIM tracking
    const interactionLog = {
        action: action,
        data: data,
        userAgent: navigator.userAgent,
        referrer: document.referrer
    };
    
    console.log('MILSIM Interaction:', interactionLog);
}

// ===== INTERSECTION OBSERVER FOR SCROLL ANIMATIONS =====
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe featured cards and fact cards
    document.querySelectorAll('.featured-card, .fact-card').forEach(element => {
        observer.observe(element);
    });
}

// ===== HEADER SCROLL BEHAVIOR =====
function initializeHeaderScroll() {
    const header = document.getElementById('header-main');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        if (currentScroll > 100) {
            if (currentScroll > lastScrollTop) {
                // Scrolling down
                header.style.boxShadow = '0 -2px 8px rgba(0, 0, 0, 0.2)';
            } else {
                // Scrolling up
                header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }
        } else {
            header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }

        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });
}

// ===== SOCIAL MEDIA INTEGRATION =====
function initializeSocialSharing() {
    const socialLinks = document.querySelectorAll('[title*="Facebook"], [title*="Twitter"], [title*="Instagram"], [title*="YouTube"]');

    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const platform = this.getAttribute('title');
            logPageInteraction('social_click', {
                platform: platform,
                timestamp: new Date().toISOString()
            });
        });
    });
}

// ===== UTILITY FUNCTIONS =====

/**
 * Scroll to a specific element smoothly
 */
function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Toggle a class on an element
 */
function toggleClass(selector, className) {
    const element = document.querySelector(selector);
    if (element) {
        element.classList.toggle(className);
    }
}

/**
 * Add class to elements
 */
function addClass(selector, className) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.add(className));
}

/**
 * Remove class from elements
 */
function removeClass(selector, className) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.remove(className));
}

// ===== OPERATIONAL STATISTICS =====
function initializeOperationalStats() {
    // Only run on homepage where operational stats are displayed
    if (!document.getElementById('operational-stats')) return;
    
    // Fetch stats immediately
    fetchOperationalStats();
    
    // Set up periodic refresh every 5 minutes
    setInterval(fetchOperationalStats, 5 * 60 * 1000);
}

async function fetchOperationalStats() {
    try {
        // Replace this URL with your published Google Sheet CSV URL
        // To get this URL: File > Share > Publish to web > CSV
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=YOUR_GID';
        
        const response = await fetch(sheetUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch operational data');
        }
        
        const csvText = await response.text();
        const data = parseCSV(csvText);
        
        // Assuming the CSV has columns: patrol_hours, patrols_done, readiness_rate, international_ops
        // And the first row is headers, second row is data
        if (data.length >= 2) {
            const stats = data[1]; // Second row contains the data
            
            updateStatDisplay('patrol-hours', stats[0] || '--');
            updateStatDisplay('patrols-done', stats[1] || '--');
            updateStatDisplay('readiness-rate', stats[2] ? stats[2] + '%' : '--');
            updateStatDisplay('international-ops', stats[3] || '--');
        }
        
        // Log successful data fetch
        logPageInteraction('stats_update', {
            timestamp: new Date().toISOString(),
            status: 'success'
        });
        
    } catch (error) {
        console.warn('Failed to fetch operational statistics:', error);
        
        // Log failed data fetch
        logPageInteraction('stats_update', {
            timestamp: new Date().toISOString(),
            status: 'failed',
            error: error.message
        });
        
        // Keep default values (--) on error
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    return lines.map(line => {
        // Simple CSV parser - handles basic commas, not complex escaping
        return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
    });
}

function updateStatDisplay(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = 'statUpdate 0.5s ease-in-out';
    }
}

// Add CSS animation for stat updates
if (!document.getElementById('operational-stats-styles')) {
    const styles = document.createElement('style');
    styles.id = 'operational-stats-styles';
    styles.textContent = `
        @keyframes statUpdate {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); color: #ffd700; }
            100% { transform: scale(1); }
        }
        
        .fact-number {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(styles);
}

// ===== ENHANCED INTERACTIVE FEATURES =====
function initializeCardHoverEffects() {
    const cards = document.querySelectorAll('.featured-card, .fact-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.23, 1, 0.320, 1)';
        });
        
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
}

function initializeScrollParallax() {
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.featured-section::before, .featured-section::after');
        
        parallaxElements.forEach(element => {
            const offset = scrolled * 0.5;
            element.style.transform = `translateY(${offset}px)`;
        });
    });
}

function initializeTextAnimations() {
    const headings = document.querySelectorAll('h2, h3, h4');
    
    const textObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const text = entry.target.textContent;
                entry.target.setAttribute('data-text', text);
                entry.target.style.animation = 'slideInDown 0.7s ease-out forwards';
                textObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    headings.forEach(heading => textObserver.observe(heading));
}

function initializeListAnimations() {
    const lists = document.querySelectorAll('.featured-card ul, .featured-card ol');
    
    lists.forEach(list => {
        const items = list.querySelectorAll('li');
        items.forEach((item, index) => {
            item.style.animation = `fadeInUp 0.6s ease-out ${index * 0.08}s backwards`;
        });
    });
}

function initializeBackToTopButton() {
    const backToTop = document.createElement('button');
    backToTop.id = 'back-to-top';
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTop.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, #ce1126, #000000);
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 20px;
        cursor: pointer;
        display: none;
        z-index: 99;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(206, 17, 38, 0.4);
    `;
    
    document.body.appendChild(backToTop);
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTop.style.display = 'flex';
            backToTop.style.alignItems = 'center';
            backToTop.style.justifyContent = 'center';
            backToTop.style.opacity = '1';
        } else {
            backToTop.style.display = 'none';
            backToTop.style.opacity = '0';
        }
    });
    
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    backToTop.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1) translateY(-5px)';
        this.style.boxShadow = '0 8px 20px rgba(206, 17, 38, 0.6)';
    });
    
    backToTop.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1) translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(206, 17, 38, 0.4)';
    });
}

// Initialize all new interactive features
document.addEventListener('DOMContentLoaded', function() {
    initializeCardHoverEffects();
    initializeScrollParallax();
    initializeTextAnimations();
    initializeListAnimations();
    initializeBackToTopButton();
});

// Export functions for external use
window.BAF_MILSIM = {
    logPageInteraction,
    highlightCurrentPage,
    scrollToElement,
    toggleClass,
    addClass,
    removeClass,
    closeSearchResults,
    scrollToResult,
    performSearch,
    fetchOperationalStats,
    initializeCardHoverEffects,
    initializeScrollParallax,
    initializeTextAnimations,
    initializeListAnimations
};

// ===== CONTACT FORM HANDLING =====
function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formResponse = document.getElementById('form-response');
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (!formResponse) return;
    
    // Disable submit button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    // Collect form data
    const formData = new FormData(form);
    
    // Submit to Formspree endpoint
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            // Show success message
            formResponse.style.display = 'block';
            formResponse.style.backgroundColor = '#d4edda';
            formResponse.style.color = '#155724';
            formResponse.style.border = '1px solid #c3e6cb';
            formResponse.innerHTML = '✓ Thank you! Your message has been sent successfully to kyli.luvxx@gmail.com';
            
            // Reset form
            form.reset();
            
            // Log interaction
            logPageInteraction('contact_form_submitted', {
                category: formData.get('category'),
                timestamp: new Date().toISOString()
            });
            
            // Hide message after 5 seconds
            setTimeout(() => {
                formResponse.style.display = 'none';
            }, 5000);
        } else {
            throw new Error('Form submission failed');
        }
    })
    .catch(error => {
        // Show error message
        formResponse.style.display = 'block';
        formResponse.style.backgroundColor = '#f8d7da';
        formResponse.style.color = '#721c24';
        formResponse.style.border = '1px solid #f5c6cb';
        formResponse.innerHTML = '✗ Sorry, there was an error sending your message. Please try again.';
        
        console.error('Contact form error:', error);
    })
    .finally(() => {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Send Message';
    });
}

// Attach form handler when page loads
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleSubmit);
    }
});
