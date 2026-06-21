# Website

This context describes product-facing concepts used by the website and its interactive tools.

## Language

**Focus**:
The site's Pomodoro-based focus timer product. Focus should act as a gentle but bounded Pomodoro coach, protecting the work-break cycle while staying lightweight.
_Avoid_: Generic timer, task timer

**Inkwell**:
The site's writing workflow product for helping independent writers move an article from draft toward publication.
_Avoid_: Blank product, generic writing app

**Independent Writer**:
A person who regularly publishes original articles under their own name or brand and needs help moving ideas into finished pieces.
_Avoid_: Any writer, casual note-taker, document editor user

**Article Draft**:
A draft of a single article that an Independent Writer intends to publish. It may target different channels, but it is not a general note, knowledge-base page, fiction manuscript, or course document.
_Avoid_: Document, note, writing project, workspace

**Completion Workflow**:
The Inkwell workflow for moving an existing Article Draft from half-finished material to a publishable piece.
_Avoid_: Blank-page generation, idea generation, template library

**Half-Finished Draft**:
An Article Draft with a central claim and enough raw material to revise, organize, and complete. A title, prompt, or single loose idea is not enough to enter Inkwell's core workflow.
_Avoid_: Idea, prompt, empty draft, title-only draft

**Structure Pass**:
The first step of the Completion Workflow, where a Half-Finished Draft is examined for its central claim, reader value, supporting sections, repetition, and missing pieces before more prose is written.
_Avoid_: Freewriting, drafting more, outline template

**Article Shape**:
The editable structure produced by the Structure Pass. It captures the Article Draft's claim, intended reader value, section order, section roles, and missing pieces so the writer can revise the article directly.
_Avoid_: Diagnostic report, advice list, generated outline

**Target Reader Promise**:
The lightweight Article Shape statement of who the Article Draft is for and what that reader should be able to do or understand after reading it.
_Avoid_: Persona, audience profile, market segment

**Central Claim**:
The one-sentence claim an Article Draft is organized around. If it cannot be stated in one sentence, the draft needs narrowing before revision continues.
_Avoid_: Topic, theme, keyword list, multiple angles

**Section Role**:
The purpose each section serves inside an Article Shape, such as framing the problem, explaining a concept, giving an example, addressing an objection, providing steps, or closing the argument.
_Avoid_: Heading style, paragraph label, content type

**Editorial Assistant**:
Inkwell's AI role for helping an Independent Writer inspect structure, find gaps, suggest revisions, and prepare publication without taking over authorship.
_Avoid_: Ghostwriter, content generator, auto-writer

**Imported Draft**:
A Markdown Article Draft pasted or imported into Inkwell so the Completion Workflow can begin from existing material instead of a blank in-app editor.
_Avoid_: New document, synced workspace, source of truth

**Publishable Markdown**:
The Completion Workflow output: a revised Markdown Article Draft that the Independent Writer is ready to copy, export, or publish elsewhere.
_Avoid_: Direct publishing, platform integration, synced final document

**Pomodoro Cycle**:
A committed focus interval followed by a real break. Only completed focus intervals count as Pomodoros.
_Avoid_: Timer session, stopwatch run

**Focus Task**:
The single task committed to before a Pomodoro Cycle starts. Every Pomodoro Cycle must have one Focus Task so completion statistics describe work advanced, not just time spent.
_Avoid_: Current task, optional task, todo item

**Abandoned Pomodoro**:
A Pomodoro Cycle that was stopped before the focus interval completed. It is not counted as a completed Pomodoro.
_Avoid_: Skipped focus, completed early, partial Pomodoro

**Protected Break**:
The break that follows a completed focus interval by default. It may be skipped, but Focus should treat skipping as an exception rather than the normal path.
_Avoid_: Optional break, idle time

**Pomodoro Rhythm**:
The configured focus, short-break, long-break, and long-break-interval pattern used by Focus. It should be chosen from bounded Pomodoro-oriented options rather than treated as arbitrary stopwatch duration.
_Avoid_: Timer settings, custom duration

**Pomodoro Estimate**:
The expected number of Pomodoro Cycles needed to complete a Focus Task. It is a calibration aid, not a success or failure judgment.
_Avoid_: Deadline, score, target

**Cycle Quality**:
How well Pomodoro Cycles preserve the intended loop: committed Focus Task, completed focus interval, Protected Break, and useful Pomodoro Estimate feedback. It is more important than raw accumulated time.
_Avoid_: Productivity score, total hours

**Completion Review**:
The lightweight confirmation step after a focus interval completes. It records the completed Pomodoro, supports task completion or continuation, and should not become a journaling workflow.
_Avoid_: Reflection form, session report, notes

**Mid-Cycle Task Switch**:
A change of Focus Task during an active focus interval. Focus treats it as abandoning the current Pomodoro Cycle before starting a different task.
_Avoid_: Retargeting, reassignment

**Distraction Inbox**:
The lightweight place to capture thoughts or tasks that appear during an active focus interval. Items captured there do not replace the current Focus Task until a later Pomodoro Cycle.
_Avoid_: Active task list, interruption log

**Next-Step Action**:
The single primary action Focus presents for the current Pomodoro phase. Secondary controls should not compete with it.
_Avoid_: Control panel, action toolbar

**Phase Reminder**:
A quiet reminder that a focus or break phase has ended and the user should move to the next Pomodoro phase. It should be opt-in when it uses browser notifications.
_Avoid_: Notification campaign, alert stream

**Phase Confirmation**:
The user action that acknowledges a completed focus or break phase before Focus starts the next phase. It prevents unattended timers from creating fake Pomodoro progress.
_Avoid_: Auto-advance, continuous loop

**Brief Pause**:
A short interruption of an active focus interval that does not change the Focus Task or break the Pomodoro Cycle. A long pause should prompt the user to continue or abandon the cycle.
_Avoid_: Split session, flexible pause

**Early Task Completion**:
The moment a Focus Task appears finished before the active focus interval ends. It does not complete the Pomodoro Cycle early.
_Avoid_: Early Pomodoro completion, finish timer

**Wrap-Up Mode**:
The state after Early Task Completion where the active Pomodoro Cycle continues and the user uses the remaining focus time to check, tidy, or prepare follow-up work.
_Avoid_: Task switching, early break

**Next-Cycle Selection**:
The choice of which Focus Task will be committed to for the next Pomodoro Cycle. It should happen during Completion Review or Phase Confirmation, not during an active focus interval.
_Avoid_: In-focus planning, live task switching

**Candidate Task Pool**:
The set of tasks that may become a Focus Task in a future Pomodoro Cycle. Items in this pool are not the current commitment.
_Avoid_: Current task list, active task list

**Interruption Tag**:
An optional lightweight label for why a Pomodoro Cycle was abandoned, such as internal distraction or external interruption. It should not be required to abandon a cycle.
_Avoid_: Required reason, interruption report

**Stability Feedback**:
Quiet feedback about recent Pomodoro consistency and Cycle Quality. It should not become streak-based gamification.
_Avoid_: Streak, badge, productivity game
