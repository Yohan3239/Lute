Lute 🎼

A focused, game-inspired spaced repetition app

Lute is an experimental spaced-repetition learning app that blends classic SRS principles with short, focused review runs and game-like feedback.

Instead of infinite queues, Lute uses snapshot-based sessions (15 or 30 cards) with optional retry mini-sessions to simulate short learning delays. The goal is to make studying feel less overwhelming while keeping the core memory benefits of spaced repetition.

This project is actively evolving.

✨ Key ideas

Snapshot sessions
Reviews happen in fixed runs (Sprint: 15 cards, Full: 30 cards). No endless queues.

Retry mini-sessions
Cards marked Wrong or Hard during learning are collected and immediately reviewed again after the main run, approximating short learning delays (e.g. 5–20 minutes).

Anki-inspired SRS (not a clone)
Uses learning, review, and relearning phases with ease factors and lapses, inspired by research from SuperMemo and Anki — but implemented independently.

Game feedback, not punishment
Points, multipliers, streaks, and time-based bonuses encourage consistency without locking progress behind perfection.

Multiple review formats

Classic flashcards

Cloze deletions

Multiple choice

True / False
(AI-generated variants are optional)

🧠 Spaced Repetition Model (high-level)

New cards

Wrong / Hard / Good → enter learning

Easy → skip learning, graduate directly

Learning

Short steps (minutes → day)

Wrong resets progress

Hard repeats the current step

Good advances

Review

Interval grows using ease factors

Wrong triggers relearning

Relearning

Short delay, then return to review at a reduced interval

Note: Because sessions are snapshot-based, short delays are implemented via retry mini-sessions rather than real-time re-queuing.

⚠️ Project status

This is an active prototype

Core logic may change

Data formats are not yet stable

Not recommended as your only long-term study tool (yet)

If you’re using this seriously, back up your data.

🧩 Tech stack

Frontend: React + TypeScript

Animations: Framer Motion

Storage: Local (for now)

SRS Engine: Custom implementation

AI (optional): LLM-generated card variants

📌 Non-goals (for now)

Perfect Anki parity

Full SuperMemo optimization

Cloud sync

Mobile apps

The focus is feel, consistency, and iteration, not theoretical optimality.

🙏 Attribution

Lute is inspired by decades of research on spaced repetition, including work from SuperMemo and Anki.
No Anki code or assets are used.

📜 License

TBD.
(Open-sourcing the core engine is under consideration once the design stabilizes.)
