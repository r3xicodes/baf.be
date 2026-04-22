# Belgian Air Force Virtual Military Simulation Website

A virtual military simulation website based on the Belgian Air Force (Force Aérienne Belge). This is a static HTML/CSS/JavaScript project created for educational and simulation purposes.

## Project Overview

This project provides a fully functional replica of the Belgian Air Force website for use in military simulation environments. The website includes information about the Belgian Air Force, career opportunities, operations, news, and contact information.

## Features

- **Responsive Design**: Mobile-friendly layout that works on all devices
- **Professional Styling**: Military-themed color scheme with official branding
- **Multiple Pages**: 
  - Homepage with mission statement and key facts
  - About page with history and core values
  - Operations page with military operations information
  - Careers page with job opportunities and benefits
  - News page with simulated news articles
  - Contact page with inquiry form
- **Navigation**: Easy-to-use menu system for site navigation
- **Interactive Elements**: Buttons, forms, and hover effects
- **Accessibility**: Semantic HTML and proper heading structure

## Project Structure

```
plaaf.cn/
├── index.html              # Homepage
├── css/
│   └── styles.css         # Main stylesheet
├── js/
│   └── main.js            # JavaScript functionality
├── pages/
│   ├── about.html         # About page
│   ├── operations.html    # Operations page
│   ├── careers.html       # Careers page
│   ├── news.html          # News page
│   └── contact.html       # Contact page
└── README.md              # This file
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server-side dependencies required

### Running the Website

1. Navigate to the project directory
2. Open `index.html` in your web browser
3. Use the navigation menu to explore different sections

Alternatively, serve the website using a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (with http-server)
npx http-server
```

Then visit `http://localhost:8000` in your browser.

## File Descriptions

### HTML Pages

- **index.html**: Main homepage with mission statement, facts, and featured sections
- **pages/about.html**: Information about Air Force history, mission, values, and organization
- **pages/operations.html**: Details about global operations and major command structure
- **pages/careers.html**: Career opportunities, benefits, and requirements
- **pages/news.html**: Simulated news articles and updates
- **pages/contact.html**: Contact form and communication channels

### CSS

- **css/styles.css**: Complete styling including:
  - Header and navigation styles
  - Hero section styling
  - Featured card layouts
  - Responsive grid systems
  - Footer styling
  - Mobile responsiveness

### JavaScript

- **js/main.js**: Functionality including:
  - Navigation interaction
  - Smooth scrolling
  - Button hover effects
  - Current page highlighting
  - Interaction logging for simulation purposes

## Customization

### Colors

The website uses CSS variables defined in `styles.css`. To customize colors, edit the `:root` section:

```css
:root {
    --primary-color: #003f7f;      /* Dark Blue */
    --secondary-color: #0066cc;    /* Blue */
    --accent-color: #ffd700;       /* Gold */
    /* ... other colors ... */
}
```

### Content

All content can be easily modified in the respective HTML files. Replace text, update links, or modify page structure as needed.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Features

### Responsive Design

The website includes responsive breakpoints for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (480px - 767px)
- Small Mobile (< 480px)

### Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Color contrast compliance
- Keyboard navigation support

## Notes

- This is a static website with no backend functionality
- Form submissions are handled client-side for simulation purposes
- Media (images, videos) are not included as per specification
- All content is for simulation and educational use only

## License

This virtual simulation website is created for educational and training purposes. The design and structure are inspired by military aviation web resources but are not official Belgian Air Force materials.

## Contact & Support

For questions about this simulation project, please review the contact page or modify the contact information as needed for your specific use case.

---

**Disclaimer**: This is a virtual military simulation website and is not affiliated with the official Belgian Air Force or Belgian Ministry of Defense. It is intended for simulation and educational purposes only.
