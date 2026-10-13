#!/bin/bash
# اختبار POST /api/analytics

RESPONSE=$(curl -s --max-time 60 -X POST \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/analytics" \
  -d '{
    "userId": "cmv5kjrt00000q17m39gu9lg9",
    "levelId": 1,
    "stars": 3,
    "hintsUsed": 0,
    "timeSpentSec": 90,
    "correctCount": 5,
    "wrongCount": 1,
    "bonusWordsFound": 2,
    "puzzleType": "crossword"
  }')

echo "Response length: ${#RESPONSE}"
echo "Response: $RESPONSE" | head -c 1500
echo
