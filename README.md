# 🧠 Automatic Quiz Generator for Confluence (Forge App)

The **Automatic Quiz Generator** is a Forge-powered app designed for Confluence Cloud. It uses Generative AI (Gemini 1.5 Flash) to convert Confluence page content into interactive, customizable quizzes in seconds — helping teams and educators save time and improve knowledge retention.

---

## 🎯 Purpose

This app solves the tedious task of manually creating quiz questions for Confluence documentation. It is ideal for:

- 📘 Employee onboarding & compliance
- 📚 Academic lesson reviews
- ✅ Knowledge checks after reading documentation

---

## ✨ Features

- 📄 Extracts content from Confluence pages
- 🤖 Uses **Gemini 1.5 Flash API** to generate quiz questions
- 🎛️ Supports **MCQ** and **True/False** formats
- 🧠 Smart word-count based question limits
- 🧩 Available in 3 modes:
  - Macro App (`/quiz-app`)
  - Context Menu App (right-click page)
  - Universal Textbox App (`/textbox-quiz-universal`)
- 📥 Download quiz review as **PDF**
- 📋 Copy review to clipboard
- 🔁 Retake quizzes with same questions

---

## 📹 Demo

🎬 **[Demo Video – How to Install and Use the App](./app-installation-demo.mp4)**

---

## 🛠️ Installation Guide

📝 **[Installation Manual (PDF)](./ForgeAPP_InstallationManual.pdf)** – Full step-by-step instructions.

Includes:
- Node.js + Forge CLI setup
- Google Gemini API Key generation
- App deployment (`quiz-app`, `quiz-context-menu`, `quiz-universal-textbox`)
- Setting environment variables
- Running `forge deploy` and `forge install`

---

## 🧰 Tech Stack

- Atlassian Forge (Custom UI)
- React + Forge Bridge
- Gemini 1.5 Flash API
- jsPDF, Axios
- Atlaskit UI components

---

## 🏗️ Architecture Overview

- Forge backend resolver handles content extraction & Gemini API calls
- Custom UI frontend renders quiz questions, handles interactions
- 3 app entry points (macro, context-menu, textbox)
- PDF and clipboard functions for exporting results

---

## 🚧 Limitations & Future Improvements

- 🔗 **No multi-page support** (currently limited to single Confluence page content)
- 🧩 **Only MCQ and True/False** supported (more formats like Fill-in-the-Blank planned)
- 💾 **No past quiz history** (results are not stored for later access)
- 🎯 **No difficulty levels** (basic-level questions only for now)

---

## 🧪 Evaluation Summary

- ✅ Usability: 3 flexible access points, user-friendly design
- 🎯 Accuracy: Context-relevant and grammatically sound questions
- 🔄 Feedback: Quiz review + retake supported
- 📤 Portability: PDF download and clipboard copy options included

---

## 📬 Contributing

Pull requests and suggestions are welcome. Please fork the repository and create a PR.

---

## 📜 License

MIT License

## 🔗 References

- [Forge Platform Docs](https://developer.atlassian.com/platform/forge/)
- [Gemini AI Studio](https://aistudio.google.com/)
- [Google AI Pricing](https://ai.google.dev/pricing#1_5flash)
