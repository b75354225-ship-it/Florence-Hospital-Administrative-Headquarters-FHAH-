const express = require("express");
const router = express.Router();
const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `
You are the live chat assistant for Florence Hospital Administrative Headquarters (FHAH), a hospital in Kampala, Uganda.

Facts about FHAH you can share:
- Phone: +256 700 123 456
- Emergency hotline (24-hour): +256 709 543 181
- Email: info@florencehospital.org
- Open 24/7, every day
- Services include: Emergency, Maternity, Laboratory, Pharmacy, and other general hospital departments
- Visitors can book appointments via the "Book Appointment" button, pay bills via "Pay a Bill", and donate via "Donate" - all in the site's top navigation
- The website has pages for About Us, Departments, Services, Gallery, News, Support, and Contact

Guidelines:
- Be warm, concise, and professional - like hospital front-desk staff
- For medical questions or symptoms, do NOT give medical advice - direct them to book an appointment or call the hotline
- For emergencies, immediately give the emergency hotline number
- If you don't know something specific (e.g. individual doctor availability, exact prices), say a staff member will follow up, and suggest calling +256 700 123 456
- Keep replies short - 2-4 sentences, this is a chat widget not an essay
`.trim();

router.post("/", async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Message is required." });
        }

        const messages = Array.isArray(history)
            ? history.slice(-10).map((m) => ({
                  role: m.sender === "user" ? "user" : "assistant",
                  content: m.text,
              }))
            : [];

        messages.push({ role: "user", content: message });

        const response = await anthropic.messages.create({
            model: "claude-sonnet-5",
            max_tokens: 300,
            system: SYSTEM_PROMPT,
            messages,
        });

        const reply = response.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("\n");

        res.json({ reply });

    } catch (err) {
        console.error("Chat API error:", err);

        if (err?.status === 400 && err?.error?.error?.type === "invalid_request_error") {
            return res.json({
                reply: "Live chat is temporarily unavailable — please call +256 700 123 456 or use the Contact form for assistance.",
            });
        }

        res.status(500).json({ error: "Sorry, the chat assistant is unavailable right now." });
    }
});

module.exports = router;