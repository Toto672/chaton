# Cron Support in Chatons Automation

## Overview

The Chatons Automation system now supports **cron-based scheduling** for automating tasks at specific times and intervals. This allows users to schedule automation tasks to run at precise times (e.g., "every day at 9am") or at regular intervals (e.g., "every 5 minutes").

## Features

### Cron Trigger Type
A new trigger type `cron` has been added to the automation system, in addition to existing event-based triggers:
- `conversation.created` - when a new conversation is created
- `conversation.message.received` - when a message is received
- `project.created` - when a project is created
- `conversation.agent.ended` - when an agent finishes processing
- **`cron`** - at specific times/intervals (NEW)

### Natural Language Support
The system can parse natural language scheduling patterns and convert them to cron expressions:

#### Time-based patterns:
- "every day at 9am"
- "every day at 9:30am"
- "every monday at 2pm"
- "every friday at 14:30"

#### Interval patterns:
- "every 5 minutes"
- "every 30 minutes"
- "every 2 hours"
- "every 7 days"

#### French patterns:
- "chaque jour à 9h" (every day at 9am)
- "tous les jours à 9h" (every day at 9am)
- "toutes les 5 minutes" (every 5 minutes)

#### Standard Cron Expressions:
You can also provide standard cron expressions directly:
- `0 9 * * *` - 9:00 AM every day
- `*/5 * * * *` - every 5 minutes
- `0 14 * * 1` - 2:00 PM every Monday
- `0 0 * * 0` - midnight every Sunday

### Cron Expression Format
Standard cron format with 5 fields:
```
minute hour day month dayOfWeek
```

Where:
- **minute**: 0-59
- **hour**: 0-23 (UTC)
- **day**: 1-31 (day of month)
- **month**: 1-12
- **dayOfWeek**: 0-6 (0=Sunday, 1=Monday, ..., 6=Saturday)

Examples:
- `0 9 * * *` - 9:00 AM daily
- `*/15 * * * *` - every 15 minutes
- `30 2 * * 0` - 2:30 AM every Sunday
- `0 9 * * 1-5` - 9:00 AM Monday-Friday

## Usage via LLM Tool

When using the `automation.schedule_task` LLM tool, you can now:

1. **Describe the schedule in natural language**:
   ```
   Create automation "Daily weather report"
   Instruction: "Give me the weather"
   Trigger: "every day at 9am"
   ```

2. **Provide explicit cron expression**:
   ```
   Create automation "Check status every 5 minutes"
   Instruction: "Check system status"
   Trigger: "cron"
   CronExpression: "*/5 * * * *"
   ```

## Implementation Details

### New Files
- `electron/extensions/runtime/cron-scheduler.ts` - Cron scheduling engine
- `electron/db/migrations/017_automation_cron_support.sql` - Database migration

### Modified Files
- `electron/extensions/runtime/constants.ts` - Added 'cron' to AUTOMATION_TRIGGER_TOPICS
- `electron/extensions/runtime/helpers.ts` - Added cron parsing functions
- `electron/extensions/runtime/automation.ts` - Integrated cron scheduler
- `electron/extensions/runtime.ts` - Initialize/shutdown cron on app lifecycle
- `electron/db/repos/automation.ts` - Support for trigger_data column
- `package.json` - Added 'cron' as optionalDependency

### Architecture

The cron scheduling system:
1. **CronScheduler class** - Manages all cron jobs
   - Uses the `node-cron` library for scheduling
   - Runs in UTC timezone
   - Provides lifecycle methods: schedule, stop, restart, stopAll

2. **Database Integration**
   - Cron expressions stored in `automation_rules.trigger_data` column
   - On app startup, all enabled cron rules are re-initialized

3. **Lifecycle Integration**
   - `initializeExtensionsRuntime()` - Loads and schedules all cron tasks on app start
   - `shutdownExtensionWorkers()` - Cleanly stops all cron jobs on app quit

### Parsing Engine

The system includes intelligent cron expression parsing:
- **parseCronExpression()** - Converts natural language to cron syntax
- **isValidCronExpression()** - Validates cron expressions
- **validateCronField()** - Validates individual cron fields

Supported patterns:
- Day/time: "every day at 9am", "every monday at 2pm"
- Intervals: "every N minutes/hours/days"
- French variants: "chaque jour à 9h", "toutes les N minutes"
- Standard cron expressions: "0 9 * * *"

## Example: Morning Weather Automation

To create a "daily weather at 9am" automation:

```python
# Via LLM tool
chaton_automation_automation_schedule_task(
    name="Météo quotidienne à 9h",
    instruction="Donne-moi la météo actuelle de ma région. Inclus la température, les conditions météorologiques, l'humidité et les prévisions pour les prochaines heures.",
    trigger="every day at 9am"
)
```

The system will:
1. Detect this is a cron-based trigger
2. Parse "every day at 9am" → "0 9 * * *"
3. Create the automation rule with cron expression
4. On app restart, schedule the cron job
5. At 9:00 AM UTC each day, execute the instruction and notify the user

## Testing Cron Expressions

You can test cron expressions online at:
- https://crontab.guru/ - Interactive cron expression builder

## Limitations & Notes

- **Timezone**: All cron jobs run in **UTC timezone**
- **Persistence**: Cron jobs are loaded from database on app startup
- **Resource usage**: Each active cron job consumes minimal resources
- **Cooldown**: Event-based triggers still respect cooldown; cron jobs do not have automatic cooldown (use cron syntax to control frequency)

## Future Enhancements

Potential improvements:
- UI for cron expression builder
- Timezone support
- Cron job execution history & analytics
- Missed execution handling (backfill)
- Cron job retry logic
