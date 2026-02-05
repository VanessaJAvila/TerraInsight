export const MAX_CONTEXT_LENGTH = 1000;
export const MAX_SAMPLE_ROWS = 3;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const PROGRESS_UPDATE_INTERVAL = 500;
export const PROGRESS_INCREMENT = 10;
export const PROGRESS_NEAR_COMPLETION = 90;

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
} as const;

export const DEFAULT_WEBHOOK_URL = "http://localhost:5678/webhook-test/eco-action";

export const ANOMALY_KEYWORDS = {
  waste: ['waste', 'inefficiency', 'loss', 'leak', 'spillage'],
  highConsumption: ['high consumption', 'above baseline', 'excessive', 'over limit'],
  emergency: ['urgent', 'critical', 'emergency', 'alert', 'failure'],
  energy: ['energy', 'consumption', 'kwh', 'power', 'usage'],
} as const;

export const LARGE_NUMBER_THRESHOLD = 1000;
export const MIN_LARGE_NUMBERS_COUNT = 3;

export const ENERGY_PER_FILE_KB = 0.001;
export const ENERGY_BASE_PROCESSING = 0.005;
export const ENERGY_ANOMALY_BONUS = 0.002;

export const ENERGY_PER_TOKEN = 0.0001;
export const CHARS_PER_TOKEN_ESTIMATE = 4;