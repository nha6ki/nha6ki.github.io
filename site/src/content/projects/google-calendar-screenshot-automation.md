---
title: "Google Calendar Screenshot Automation"
summary: "An automated workflow that captures a rolling seven-day Google Calendar view and archives daily screenshots to Google Drive."
date: "2026-09"
technologies:
  - Python
  - Playwright
  - Google Chrome
  - rclone
  - Google Drive API
  - systemd
  - Ubuntu
image: "/images/projects/google-calendar-screenshot.webp"
imageAlt: "Seven-day Google Calendar view showing fictional sample events."
order: 99
featured: false
links: []
---

## Overview

I built a Linux-based workflow to preserve daily visual snapshots of Google Calendar without manually opening the calendar, taking a screenshot, and uploading it. The system captures a rolling seven-day view using the Google Calendar web interface and archives each image in Google Drive.

## Implementation

- **Browser automation:** Python and Playwright capture the calendar with headless Google Chrome, using a dedicated browser profile for the authenticated session.
- **Cloud storage:** Screenshots are saved locally as date-stamped PNG files and uploaded to Google Drive with rclone and OAuth 2.0.
- **Scheduling:** A systemd user service and timer run the workflow automatically, including when the user is logged out, provided the computer remains running.

## Results

I verified the complete workflow on Ubuntu 22.04: the calendar view was captured, the PNG was saved locally, and the file was uploaded to Google Drive. The systemd-triggered run completed successfully.

The public example uses fictional calendar events. Authentication files and screenshots containing real schedule details are excluded from the repository.

## Source Code

[GitHub repository and setup instructions](https://github.com/nha6ki/google-calendar-screenshot-automation)
