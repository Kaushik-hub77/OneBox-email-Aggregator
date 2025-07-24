AI Email Dashboard
A full-stack, real-time email dashboard that:
Synchronizes multiple IMAP accounts in real-time (IDLE mode, no cron jobs)
Categorizes emails using DeepSeek v3 AI (Interested, Meeting Booked, Not Interested, Spam, Out of Office)
Stores and indexes emails in Elasticsearch for fast, filterable, and full-text search
Provides a simple React frontend for searching, filtering, and viewing categorized emails
Features
Real-Time Email Sync:
Connects to multiple IMAP accounts and fetches the last 30 days of emails, keeping them up-to-date in real time using persistent IMAP (IDLE mode).
AI Email Categorization:
Uses DeepSeek v3 (via OpenRouter) to automatically categorize each email into:
Interested
Meeting Booked
Not Interested
Spam
Out of Office
Searchable Storage:
All emails are indexed in a local Elasticsearch instance (via Docker).
Filter/search by account, folder (category), and full-text content.
Frontend Dashboard:
View, search, and filter emails by account and category.
See AI-categorized folders.
Minimal, functional UI (no heavy CSS or animations).
Easy Local Setup:
Docker Compose for Elasticsearch
Single command to run both backend and frontend
Tech Stack
Backend: Node.js, TypeScript, Express.js, ImapFlow, DeepSeek v3 API
Frontend: React, TypeScript
Database/Search: Elasticsearch (Docker)
Containerization: Docker, Docker Compose
Project Structure
