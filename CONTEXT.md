# Website

This context describes product-facing concepts used by the website and its interactive tools.

## Language

**Focus**:
The site's Pomodoro-based focus timer product. Focus should act as a gentle but bounded Pomodoro coach, protecting the work-break cycle while staying lightweight.
_Avoid_: Generic timer, task timer

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
