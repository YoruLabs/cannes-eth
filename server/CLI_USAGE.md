# Challenge Management CLI Tools

Simple command-line tools for managing health challenges.

## Prerequisites

Make sure you have your environment variables set up in `.env`:

```env
PRIVATE_KEY=your_private_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Available Commands

### 1. Create a Challenge

Creates a new predefined sleep challenge:

```bash
# Using pnpm script
pnpm challenge:create

# Or directly
node scripts/create-challenge.js
```

**What it does:**

- Shows available predefined challenges
- Creates the first one (Sleep Efficiency Master)
- Deploys to blockchain and saves to database

### 2. List All Challenges

Shows all challenges with their status:

```bash
# Using pnpm script
pnpm challenge:list

# Or directly
node scripts/list-challenges.js
```

**What it shows:**

- Challenge ID, title, status
- Entry fee and participant count
- Sleep metrics (if applicable)
- Current status indicators

### 3. View Challenge Details

Shows detailed information about a specific challenge:

```bash
# Using pnpm script
pnpm challenge:view 1

# Or directly
node scripts/view-challenge.js 1
```

**What it shows:**

- Complete challenge details
- Time windows and status
- Sleep metrics configuration
- Blockchain information
- Participant list with metrics

### 4. Start a Challenge

Opens the entry period for a challenge:

```bash
# Using pnpm script
pnpm challenge:start 1

# Or directly
node scripts/start-challenge.js 1
```

**What it does:**

- Updates challenge status to `entry_open`
- Users can now join the challenge
- Sets the started timestamp

### 5. Finish a Challenge

Completes a challenge and determines winners:

```bash
# Using pnpm script
pnpm challenge:finish 1

# Or directly
node scripts/finish-challenge.js 1
```

**What it does:**

- For sleep challenges: Calculates participant metrics automatically
- Determines winners based on requirements
- Completes the challenge on blockchain
- Updates participant statuses

## Example Workflow

Here's a typical workflow for managing a sleep challenge:

```bash
# 1. Create a new challenge
pnpm challenge:create

# 2. List challenges to see the new one
pnpm challenge:list

# 3. View details of challenge #1
pnpm challenge:view 1

# 4. Start the challenge (open entry period)
pnpm challenge:start 1

# 5. (Wait for participants to join and challenge period to complete)

# 6. Finish the challenge and determine winners
pnpm challenge:finish 1

# 7. View final results
pnpm challenge:view 1
```

## Challenge Statuses

- **`created`**: Challenge created but not yet open for entries
- **`entry_open`**: Users can join the challenge
- **`entry_closed`**: Entry period ended, challenge about to start
- **`active`**: Challenge tracking period active
- **`completed`**: Challenge finished, winners determined

## Sleep Challenge Features

Sleep challenges automatically:

- Calculate metrics from your existing `sleep_metrics` table
- Support different calculation methods (average, total, min, max)
- Compare results using various operators (>=, <=, ==, >, <)
- Determine winners based on who meets requirements
- Handle multiple winners (configurable)

## Predefined Challenges

The system includes:

1. **Sleep Efficiency Master**
   - Target: 85% average sleep efficiency
   - Duration: 7 days
   - Entry fee: 0.01 WLD

2. **9-Hour Sleep Challenge**
   - Target: 9+ hours average sleep duration
   - Duration: 7 days
   - Entry fee: 0.01 WLD

## Troubleshooting

### Common Issues

1. **"Challenge not found"**: Make sure the challenge ID exists
2. **"Database error"**: Check your Supabase credentials
3. **"Contract error"**: Verify your private key and network connection
4. **"No sleep data"**: Ensure sleep metrics exist for participants

### Getting Help

- Check the console output for detailed error messages
- Use `pnpm challenge:view <id>` to see challenge status
- Verify your environment variables are set correctly

## Advanced Usage

You can also import and use these functions in your own scripts:

```javascript
const { createChallenge } = require('./scripts/create-challenge');
const { finishChallenge } = require('./scripts/finish-challenge');

// Create a challenge programmatically
await createChallenge();

// Finish a specific challenge
await finishChallenge(1);
```
