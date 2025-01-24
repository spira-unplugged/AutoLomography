# AutoLomography

## What is AutoLomography?

AutoLomography is a bot that connects to the Lomography film photography community and automatically posts photos to X (formerly Twitter) every 6 hours. This project is designed to bring the joy of analog photography to a wider audience through automation.

- **X Account**: [https://x.com/AutoLomography](https://x.com/AutoLomography)  
- **Spreadsheet Data**: [https://t.co/oYC8rCtb3w](https://t.co/oYC8rCtb3w)

---

## Features

- **Fetch Photos from Lomography API**: The bot fetches random photos from the Lomography platform using its API.
- **Duplicate Check**: Ensures that no photo is posted more than once by checking against a Google Spreadsheet.
- **Automated Twitter Posting**: Posts fetched photos with descriptions and hashtags to X.
- **Customizable Schedule**: Can be configured to post at regular intervals (default: every 6 hours).

---

## How It Works

### 1. **Fetch Photos**
   - Uses the Lomography API to fetch random photos.
   - Each photo includes metadata such as title, description, and image URL.

### 2. **Check for Duplicates**
   - Before posting, the bot checks if the photo ID exists in the Google Spreadsheet.
   - If a duplicate is found, the bot fetches another photo.

### 3. **Post to X**
   - Posts the photo along with relevant hashtags to the configured X account.
   - Adds metadata, such as title and description, as alternative text (Alt Text) for accessibility.

### 4. **Record Data**
   - Saves the posted photo ID and metadata to the Google Spreadsheet to prevent future duplicates.

---

## Installation

### Prerequisites
1. **Google Apps Script**: This bot is built using Google Apps Script.
2. **Twitter Developer Account**: You need access to Twitter API keys (Client ID and Client Secret).
3. **Lomography API Key**: Obtain an API key from the Lomography API.
4. **Google Spreadsheet**: Create a spreadsheet to track posted photos.

### Setup
1. **Clone the Repository**
   ```bash
   git clone https://github.com/spira-unplugged/AutoLomography.git