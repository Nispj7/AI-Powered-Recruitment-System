import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "interview.db")

# OpenAI key from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


# Interview settings
TOTAL_QUESTIONS = 5

# Multi-criteria thresholds (tune later if you want, but these are stable defaults)
TEXT_CONF_AVG_MIN = 0.65
TEXT_CONF_LOW_CUTOFF = 0.50
TEXT_CONF_LOW_MAX_COUNT = 4

STRESS_AVG_MAX = 0.75
STRESS_SPIKE = 0.85
STRESS_SPIKE_MAX_COUNT = 3

# Coding criteria
CODING_ATTEMPTS_MIN = 2
CODING_PASS_SCORE_MIN = 6  # out of 10 (GPT rubric)
