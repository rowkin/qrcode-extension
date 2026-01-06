# QR Code Generator Chrome Extension

A simple and user-friendly Chrome extension for quickly generating QR codes from current page URLs, selected text, or links.

## Features

- Multiple QR Code Generation Methods:
  - Generate QR code for current page via extension icon
  - Generate QR code for selected text via context menu
  - Generate QR code for links via context menu
  - Generate QR code for current page via context menu

- User-Friendly Interface:
  - Centered floating panel
  - Semi-transparent overlay
  - Smooth animations
  - Responsive layout
  - Elegant loading animation
  - Clear error states

- Convenient Operations:
  - One-click URL copy
  - Click-to-select URL text
  - Copy success feedback
  - Close panel via overlay or close button
  - ESC key shortcut to close
  - One-click QR code download
  - **Custom QR code colors** (v1.0.5 new)
    - Customize foreground and background colors
    - 5 preset color themes
    - Real-time color preview
    - Auto-save color settings

- Multi-language Support:
  - English
  - Chinese
  - Japanese
  - Auto-detects browser language

## Installation

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "QR Code Generator"
3. Click "Add to Chrome"
4. Follow the prompts to complete installation

## How to Use

### Method 1: Via Extension Icon

1. Click the extension icon in the browser toolbar
2. QR code for the current page will be generated automatically

### Method 2: Via Context Menu

1. Select text or right-click a link
2. Choose "Generate QR Code" from the context menu
3. QR code will be generated for the selected content

## Features in Detail

- **QR Code Generation**:
  - High-quality QR codes using QRCode.js
  - Smooth loading animation
  - Clear error state feedback

- **URL Management**:
  - One-click URL copy
  - Copy success animation
  - Quick URL text selection

- **QR Code Download**:
  - One-click QR code image download
  - Auto-generated timestamp filenames
  - Download success notification
  - Hover-to-show download button

- **Panel Control**:
  - Close via button
  - Close via overlay
  - ESC key shortcut
  - Auto-cleanup of old panels

- **Multi-language Support**:
  - English, Chinese, and Japanese
  - Automatic browser language detection
  - Internationalized text elements

## Technical Implementation

- Built with Chrome Extension Manifest V3
- Core Components:
  - Background script for menu and message handling
  - Content script for panel injection and interaction
  - Popup script for icon click handling
- QRCode.js for QR code generation
- Pure JavaScript implementation
- Canvas for QR code image export
- i18n support for internationalization

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers 88+

## Changelog

### v1.0.6 (2026-01-06)
- ✅ **UI Redesign**: Split-panel layout optimization
  - Left panel: QR code display with title and version
  - Right panel: Settings with fixed header/footer and scrollable content
  - Improved visual hierarchy and spacing
- ✅ **New Feature**: QR code padding control
  - Adjustable padding/margin (0-100)
  - 4 preset padding options (None/Small/Medium/Large)
  - Real-time preview
- ✅ **Enhanced UX**:
  - Added "QR Code Generator" title in left panel
  - Display version number (v1.0.6) in footer
  - Improved layout alignment and spacing
  - Centered floating download button with hover effect
- ✅ **Error Handling**:
  - URL length validation (max 500 chars)
  - User-friendly error messages
  - Suggestion to use URL shortener for long URLs

### v1.0.5 (2024-12-30)
- ✅ **New Feature**: Custom QR code colors
  - Customize foreground and background colors
  - 5 preset color themes
  - Real-time color preview
  - Auto-save color settings

### v1.0.4
- Initial release

## Future Plans

- [x] Custom QR code colors (v1.0.5)
- [ ] Adjustable QR code size
- [ ] QR code preview feature
- [ ] Additional language support
- [ ] QR code style templates
- [ ] History feature

## Contributing

Issues and Pull Requests are welcome to help improve this extension.

## License

MIT License
