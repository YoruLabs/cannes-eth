# Health Challenge System

This document describes the health challenge system implementation that integrates smart contracts with a backend service and database, including sleep-based challenges with automatic metric calculation.

## Overview

The health challenge system allows users to:

- Create health challenges with WLD token stakes
- Join challenges by staking tokens
- Complete challenges with automatic winner determination based on sleep metrics
- Track participation and results in a database
- Support time-windowed challenges with entry periods

## Architecture

### Components

1. **Smart Contract Integration**: Uses Viem to interact with the Health Challenge contract on World Chain Mainnet
2. **Database**: Supabase tables for storing challenge metadata, participation data, and sleep metrics
3. **API Routes**: RESTful endpoints for challenge operations
4. **Service Layer**: Unified business logic for challenge management and sleep metric calculations

### Smart Contract

- **Address**: `0xB36b82E2090D574Dfd5f3bCc835af09A3De8fb1F`
- **Network**: World Chain Mainnet (Chain ID: 480)
- **Token**: WLD (`0x2cFc85d8E48F8EAB294be644d9E25C3030863003`)

## Database Schema

### `challenges` Table

| Column                        | Type          | Description                                                |
| ----------------------------- | ------------- | ---------------------------------------------------------- |
| `id`                          | SERIAL        | Primary key                                                |
| `challenge_id`                | INTEGER       | Unique challenge ID from contract                          |
| `title`                       | VARCHAR(255)  | Challenge title                                            |
| `description`                 | TEXT          | Challenge description                                      |
| `entry_fee`                   | DECIMAL(18,8) | Entry fee in WLD tokens                                    |
| `challenge_type`              | VARCHAR(50)   | Type (sleep_efficiency, sleep_duration, etc.)              |
| `entry_start_time`            | TIMESTAMP     | When users can start joining                               |
| `entry_end_time`              | TIMESTAMP     | When entry period closes                                   |
| `challenge_start_time`        | TIMESTAMP     | When challenge tracking begins                             |
| `challenge_end_time`          | TIMESTAMP     | When challenge tracking ends                               |
| `metric_type`                 | VARCHAR(50)   | Sleep metric to track                                      |
| `metric_calculation`          | VARCHAR(20)   | How to calculate (average, total, etc.)                    |
| `target_value`                | DECIMAL(10,4) | Target value to achieve                                    |
| `target_unit`                 | VARCHAR(20)   | Unit of target value                                       |
| `comparison_operator`         | VARCHAR(10)   | Comparison method (gte, lte, etc.)                         |
| `winner_count`                | INTEGER       | Number of winners                                          |
| `requirements`                | JSONB         | Challenge requirements                                     |
| `status`                      | VARCHAR(20)   | Status (created, entry_open, active, completed, cancelled) |
| `created_at`                  | TIMESTAMP     | Creation timestamp                                         |
| `started_at`                  | TIMESTAMP     | Challenge start timestamp                                  |
| `completed_at`                | TIMESTAMP     | Completion timestamp                                       |
| `transaction_hash`            | VARCHAR(66)   | Creation transaction hash                                  |
| `completion_transaction_hash` | VARCHAR(66)   | Completion transaction hash                                |

### `challenge_participations` Table

| Column                     | Type          | Description                                      |
| -------------------------- | ------------- | ------------------------------------------------ |
| `id`                       | SERIAL        | Primary key                                      |
| `challenge_id`             | INTEGER       | Reference to challenge                           |
| `wallet_address`           | VARCHAR(42)   | Participant wallet address                       |
| `joined_at`                | TIMESTAMP     | Join timestamp                                   |
| `transaction_hash`         | VARCHAR(66)   | Join transaction hash                            |
| `calculated_metric_value`  | DECIMAL(10,4) | Calculated sleep metric value                    |
| `data_points_count`        | INTEGER       | Number of sleep data points                      |
| `meets_requirements`       | BOOLEAN       | Whether participant meets challenge requirements |
| `last_data_update`         | TIMESTAMP     | Last metric calculation update                   |
| `qualification_checked_at` | TIMESTAMP     | When qualification was last checked              |
| `status`                   | VARCHAR(20)   | Status (active, completed, winner, disqualified) |

### `sleep_metrics` Table (Existing)

Contains sleep data from Terra API webhooks with fields like:

- `user_id`, `total_sleep_duration_seconds`, `sleep_efficiency`
- `start_time`, `end_time`
- Various physiological metrics

## Service Functions

### ChallengeService (Unified)

#### Core Challenge Operations

- **`createChallenge(challengeData)`** - Creates challenge on blockchain and stores in database
- **`getChallengeDetails(challengeId)`** - Fetches comprehensive challenge information
- **`getAllChallenges()`** - Retrieves all challenges with metadata
- **`addParticipant(challengeId, walletAddress, transactionHash)`** - Records participation
- **`completeChallenge(challengeId, winnerAddresses)`** - Completes challenge with automatic winner determination

#### Sleep Challenge Specific

- **`calculateParticipantMetric(participationId, challenge)`** - Calculates sleep metrics for individual participants
- **`getSleepMetricsForChallenge(walletAddress, startTime, endTime)`** - Retrieves sleep data for challenge periods
- **`calculateMetricValue(sleepMetrics, metricType, calculationMethod)`** - Computes metrics using different methods
- **`checkRequirements(calculatedValue, targetValue, comparisonOperator)`** - Validates if participants meet criteria
- **`calculateAllParticipantMetrics(challengeId)`** - Processes all participants in a challenge
- **`getChallengeWinners(challengeId)`** - Determines winners based on calculated metrics
- **`getPredefinedSleepChallenges()`** - Provides ready-to-use sleep challenge configurations

#### Automatic Winner Logic

The `completeChallenge()` method automatically:

- Detects sleep challenges (has `metricType`)
- Calculates participant metrics from sleep data
- Determines winners based on requirements
- Falls back to mock logic for legacy challenges

## Predefined Sleep Challenges

The system includes two ready-to-deploy challenges:

1. **Sleep Efficiency Master**: 85% average efficiency over 7 days
2. **9-Hour Sleep Challenge**: 9+ hours average duration over 7 days

Both include:

- 24-hour entry windows
- 7-day tracking periods
- Automatic metric calculation
- Winner determination based on sleep data

## Environment Configuration

Add to your `.env` file:

```env
# Blockchain Configuration
PRIVATE_KEY=0xddfc19cf4d3f82685d82fe4f3fd9d7c8998695bfc8bf3dc2550254196aeddddc

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Setup

Run the migrations in order:

```bash
# Base schema
psql -f migrations/001_create_challenges_tables.sql

# Sleep challenge enhancements
psql -f migrations/002_add_sleep_challenge_columns.sql
```

## CLI Scripts

Simple command-line tools for challenge management:

```bash
# Create a predefined sleep challenge
pnpm challenge:create

# List all challenges
pnpm challenge:list

# View detailed challenge info
pnpm challenge:view <challengeId>

# Start a challenge (open entry period)
pnpm challenge:start <challengeId>

# Finish a challenge (calculate winners and complete)
pnpm challenge:finish <challengeId>
```

See `CLI_USAGE.md` for detailed usage instructions and examples.

## Usage Examples

### Creating a Sleep Challenge

```javascript
const challengeService = require('./src/services/challengeService');

// Use predefined configuration
const sleepChallenges = challengeService.getPredefinedSleepChallenges();
const newChallenge = await challengeService.createChallenge(sleepChallenges[0]);
```

### Completing a Challenge with Automatic Winners

```javascript
// For sleep challenges - winners determined automatically
const result = await challengeService.completeChallenge(1);

// For legacy challenges - specify winners manually
const result = await challengeService.completeChallenge(1, ['0x742d35Cc...']);
```

## Challenge Lifecycle

1. **Created**: Challenge created on blockchain and database
2. **Entry Open**: Users can join during entry window
3. **Entry Closed**: Entry period ended, challenge about to start
4. **Active**: Challenge tracking period active
5. **Completed**: Challenge finished, winners determined and rewarded

## Integration Notes

- Sleep challenges automatically calculate metrics from existing `sleep_metrics` table
- Wallet addresses must be linked to Terra user IDs for sleep data access
- Time windows ensure fair participation and clear challenge phases
- Flexible metric system supports various sleep-based challenges

## Security Considerations

1. **Private Key**: Store securely, use environment variables
2. **Database Access**: Use service role key for backend operations
3. **Input Validation**: All endpoints validate input parameters
4. **Transaction Verification**: Verify transaction hashes before recording
5. **Metric Calculation**: Validate sleep data integrity before determining winners

## Future Enhancements

1. **User Mapping**: Link wallet addresses to Terra user IDs
2. **Real-time Updates**: Live challenge status and leaderboards
3. **Challenge Templates**: More predefined challenge types
4. **Advanced Metrics**: Complex sleep quality calculations
5. **Reward Distribution**: Automatic reward calculations
6. **Social Features**: Team challenges and social sharing
