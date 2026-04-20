# Job Board Scraper

Automated scraper that runs every 12 hours (8am & 8pm ET) to find content/marketing/communications/research positions.

## Criteria

- **Roles**: Content, Marketing, Communications, Research (entry-level preferred)
- **Location**: Remote or hybrid strongly preferred
- **Recency**: Posted within last 2-3 weeks
- **Urgency**: Prioritizes "urgently hiring" positions

## Job Boards Monitored

1. Indeed
2. LinkedIn Jobs
3. Google Jobs/Careers
4. Wellfound (formerly AngelList)

## Files

- `seen_jobs.json` - Tracks job IDs to prevent duplicates
- `results/` - Historical search results by date
